/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// eslint-disable-next-line max-classes-per-file
import { AppDataSourceFactory } from "@datasources/datasource"
import { initTardis } from "@datasources/tardis"
import { TradePair } from "@entities/trade_pair"
import { TradePairSymbol } from "@lib/types"
import { Context, Service, ServiceBroker } from "moleculer"
import newrelic from "newrelic"
import {
  combine,
  Computable,
  compute,
  Exchange,
  NormalizedData,
  normalizeTrades,
  streamNormalized,
  Trade,
  Writeable
} from "tardis-dev"
import { DataSource, InsertQueryBuilder } from "typeorm"
export default class TradePairService extends Service {
  state: ProcessingStateEnum = ProcessingStateEnum.Idle
  readonly BATCH_SIZE = 300
  readonly HIGH_WATERMARK = 200
  batchedOffset = 0
  batchedRecords: TradePair[] = new Array(this.BATCH_SIZE)
  private datasource!: DataSource
  private dbWriter!: InsertQueryBuilder<TradePair>
  private lastMessage?: Trade | TradeBucket

  // @ts-ignore
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: "trade_pairs",

      settings: {
        $dependencyTimeout: 60000,

        skipPersist: process.env.TRADE_PAIRS_SKIP_PERSIST === "true",

        tradePairAssets: process.env.TRADE_PAIRS_ASSETS
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      /**
       * Actions
       */
      actions: {
        /**
         * Generate a new token.
         */
        lastMessage: {
          visibility: "public",
          handler(this: TradePairService, ctx: Context) {
            return Promise.resolve(this.lastMessage)
          }
        }
      },

      /**
       * Methods
       */
      methods: {},

      created() {
        this.datasource = AppDataSourceFactory("trade_pairs")
      },

      /**
       * Service created lifecycle event handler
       */
      started(this: TradePairService) {
        const onError = (err: Error) => this.onStreamError(err)

        initTardis()

        const exchangePairs = this.selectTradePairs()

        /**
         * This promise will be used to resolve the `started` event in moleculer.service
         */
        const dbInitPromise = this.datasource.isInitialized
          ? Promise.resolve()
          : this.datasource.initialize().then(datasource => {
              this.dbWriter = datasource.manager.createQueryBuilder().insert().into(TradePair)
              return
            })

        return new Promise<void>((resolve, reject) => {
          const realTimeStreams = exchangePairs.map(options =>
            compute(streamNormalized(options, normalizeTrades), computeTradeBucket({ kind: "time", interval: 1000 }))
          )

          const combinedMessageStream = combine(...realTimeStreams)

          // const messages = streamNormalized(
          //   {
          //     exchange: "binance",
          //     symbols: ["ETHUSDT"],
          //     onError
          //   },
          //   normalizeTrades
          // )

          // computedMessages = compute(messages, computeTradeBucket({ kind: "time", interval: 1000 }))

          /**
           * When this promise resolves, it signals that the service is started.
           */
          dbInitPromise.then(resolve).catch(reject)

          this.processMessages(/*computedMessages*/ combinedMessageStream)
            .then(() => this.logger.info("Finished"))
            .catch((err: unknown) => this.onStreamError(err as Error))
        }).catch(onError)
      },

      stopped(this: TradePairService): Promise<void> {
        return this.datasource.isInitialized ? this.datasource.destroy() : Promise.resolve()
      }
    })
  }

  onStreamError(err: Error) {
    newrelic.noticeError(err, { service: "trade_pair" })
    this.logger.error("onStreamError", err)
  }

  async processMessages(messages: AsyncIterableIterator<Trade | TradeBucket>) {
    for await (const message of messages) {
      if (message.type === "trade_bucket") {
        await this.captureMessage(message)
      }
      // this.emitTradeOfLastSecond(message)
    }
  }

  private async captureMessage(message: Trade | TradeBucket) {
    const { timestamp, exchange, symbol, id, price, localTimestamp } = message
    // this.logger.info(message)
    this.lastMessage = message

    await this.executeInsert({
      timestamp: message.type === "trade_bucket" ? message.closeTimestamp : timestamp,
      exchange,
      symbol: symbol as TradePairSymbol,
      id,
      price: price.toString(),
      localTimestamp
    })
  }
  // batch() {
  //   if (this.batchedOffset > this.HIGH_WATERMARK && this.state === ProcessingStateEnum.Batch) {
  //     this.state = ProcessingStateEnum.Insert
  //     this.broker.emit("batch_insert", true) // ,opts
  //     const insertCount = this.executeInsert()
  //     this.state = ProcessingStateEnum.Batch
  //   }
  // }

  private async executeInsert(tradePair: TradePair) {
    await this.dbWriter.values([tradePair]).execute()
  }

  private selectTradePairs() {
    return tradePairAssets[this.settings.tradePairAssets as "BTC" | "ETH"]
  }
}

enum ProcessingStateEnum {
  Idle = "idle",
  Ready = "ready",
  Batch = "batch",
  Insert = "insert",
  Dead = "dead"
}

export type TradeBucket = {
  readonly type: "trade_bucket"
  readonly symbol: string
  readonly exchange: Exchange
  readonly name: string
  readonly interval: number
  readonly kind: "time"
  readonly id: string | undefined

  readonly trades: number
  readonly openTimestamp: Date
  readonly closeTimestamp: Date
  readonly price: number

  readonly timestamp: Date
  readonly localTimestamp: Date
}

type TradeBucketComputableOptions = { kind: BucketKind; interval: number; name?: string }

type BucketKind = "time"

const kindSuffix: { [key in BucketKind]: string } = {
  time: "sec"
}

const DATE_MIN = new Date(-1)

class TradeBucketComputable implements Computable<TradeBucket> {
  public readonly sourceDataTypes = ["trade"]

  private _inProgress: Writeable<TradeBucket>
  private readonly _kind: BucketKind
  private readonly _interval: number
  private readonly _name: string
  private readonly _type = "trade_bucket"

  constructor({ kind, interval, name }: TradeBucketComputableOptions) {
    this._kind = kind
    this._interval = interval

    if (name === undefined) {
      this._name = `${this._type}_${interval}${kindSuffix[kind]}`
    } else {
      this._name = name
    }

    this._inProgress = {} as any
    this._reset()
  }

  public *compute(message: Trade): IterableIterator<TradeBucket> {
    if (this._hasNewBucket(message.timestamp)) {
      yield this._computeBucket(message)
    }

    if (message.type !== "trade") {
      return
    }

    // update in progress bucket with new data
    this._update(message)

    // and check again if there is a new trade bar after the update (volume/tick based trade bars)
    if (this._hasNewBucket(message.timestamp)) {
      yield this._computeBucket(message)
    }
  }

  private _computeBucket(message: NormalizedData) {
    this._inProgress.localTimestamp = message.localTimestamp
    this._inProgress.symbol = message.symbol
    this._inProgress.exchange = message.exchange

    const trade: TradeBucket = { ...this._inProgress }

    this._reset()

    return trade
  }

  private _hasNewBucket(timestamp: Date): boolean {
    if (this._inProgress.trades === 0) {
      return false
    }

    if (this._kind === "time") {
      const currentTimestampTimeBucket = this._getTimeBucket(timestamp)
      const openTimestampTimeBucket = this._getTimeBucket(this._inProgress.openTimestamp)
      if (currentTimestampTimeBucket > openTimestampTimeBucket) {
        // set the timestamp to the end of the period of given bucket
        this._inProgress.timestamp = new Date((openTimestampTimeBucket + 1) * this._interval)

        return true
      }

      return false
    }

    return false
  }

  private _update(trade: Trade) {
    const inProgress = this._inProgress
    const isNotOpenedYet = inProgress.trades === 0

    if (isNotOpenedYet) {
      inProgress.openTimestamp = trade.timestamp
    }

    inProgress.id = trade.id
    inProgress.price = trade.price
    inProgress.timestamp = trade.timestamp
    inProgress.closeTimestamp = trade.timestamp
    inProgress.localTimestamp = trade.localTimestamp
    inProgress.trades += 1
  }

  private _reset() {
    const bucketToReset = this._inProgress
    bucketToReset.type = this._type
    bucketToReset.symbol = ""
    bucketToReset.exchange = "" as any
    bucketToReset.name = this._name
    bucketToReset.interval = this._interval
    bucketToReset.kind = this._kind
    bucketToReset.price = 0
    bucketToReset.id = undefined
    bucketToReset.trades = 0
    bucketToReset.openTimestamp = DATE_MIN
    bucketToReset.closeTimestamp = DATE_MIN
    bucketToReset.localTimestamp = DATE_MIN
    bucketToReset.timestamp = DATE_MIN
  }

  private _getTimeBucket(timestamp: Date) {
    return Math.floor(timestamp.valueOf() / this._interval)
  }
}

const computeTradeBucket =
  (options: TradeBucketComputableOptions): (() => Computable<TradeBucket>) =>
  () =>
    new TradeBucketComputable(options)

const tradePairAssets: Record<"BTC" | "ETH", { exchange: Exchange; symbols: TradePairSymbol[] }[]> = {
  ETH: [
    { exchange: "binance", symbols: ["ETHUSDT"] },
    { exchange: "bitstamp", symbols: ["ETHUSD"] },
    { exchange: "coinbase", symbols: ["ETH-USD"] },
    { exchange: "ftx", symbols: ["ETH-USD"] },
    { exchange: "gemini", symbols: ["ETHUSD"] },
    { exchange: "kraken", symbols: ["ETH/USD"] }
  ],
  BTC: [
    { exchange: "binance", symbols: ["BTCUSDT"] },
    { exchange: "bitstamp", symbols: ["BTCUSD"] },
    { exchange: "coinbase", symbols: ["BTC-USD"] },
    { exchange: "ftx", symbols: ["BTC-USD"] },
    { exchange: "gemini", symbols: ["BTCUSD"] },
    { exchange: "kraken", symbols: ["BTC/USD"] }
  ]
}
