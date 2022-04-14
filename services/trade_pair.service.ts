/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// eslint-disable-next-line max-classes-per-file
import { computeTradeBucket, TradeBucket } from "@computables/trade_bucket"
import { AppDataSource } from "@datasources/datasource"
import { initTardis } from "@datasources/tardis"
import { TradePair } from "@entities/trade_pair"
import { TradePairSymbol } from "@lib/types"
import { ensure } from "@lib/utils/ensure"
import { Context, Service, ServiceBroker } from "moleculer"
import newrelic from "newrelic"
import { combine, compute, Exchange, normalizeTrades, streamNormalized, Trade } from "tardis-dev"
export default class TradePairService extends Service {
  //state: ProcessingStateEnum = ProcessingStateEnum.Idle
  readonly BATCH_SIZE = 300
  readonly HIGH_WATERMARK = 200
  batchedOffset = 0
  batchedRecords: TradePair[] = new Array(this.BATCH_SIZE)
  // private datasource!: DataSource
  // private dbWriter!: InsertQueryBuilder<TradePair>
  private lastMessage?: Trade | TradeBucket

  // @ts-ignore
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: ensure("SERVICE_NAME", "tradepair"),

      settings: {
        $dependencyTimeout: 60000,

        skipPersist: process.env.TRADE_PAIRS_SKIP_PERSIST === "true",

        tradePairAssets: ensure("TRADE_PAIRS_ASSETS")
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

      // created(this: TradePairService) {
      //   this.datasource = AppDataSource
      // },

      /**
       * Service created lifecycle event handler
       */
      started(this: TradePairService) {
        const onError = (err: Error) => this.onStreamError(err)

        initTardis()

        const exchangePairs = this.selectTradePairs()
        this.logger.info("processing", exchangePairs)

        /**
         * This promise will be used to resolve the `started` event in moleculer.service
         */
        return new Promise<void>((resolve, reject) => {
          const realTimeStreams = exchangePairs.map(options =>
            compute(streamNormalized(options, normalizeTrades), computeTradeBucket({ kind: "time", interval: 1000 }))
          )

          const combinedMessageStream = combine(...realTimeStreams)

          /**
           * When this promise resolves, it signals that the service is started.
           */
          resolve()

          this.processMessages(/*computedMessages*/ combinedMessageStream)
            .then(() => this.logger.info("Finished"))
            .catch((err: unknown) => this.onStreamError(err as Error))
        }).catch(onError)
      }
    })
  }

  onStreamError(err: Error) {
    newrelic.noticeError(err, { service: this.name })
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
    await AppDataSource.manager.createQueryBuilder().insert().into(TradePair).values([tradePair]).execute()
  }

  private selectTradePairs() {
    this.logger.info("assets", this.settings.tradePairAssets)
    return tradePairAssets[this.settings.tradePairAssets as "BTC" | "ETH"]
  }
}

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
