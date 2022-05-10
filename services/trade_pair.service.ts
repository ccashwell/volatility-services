/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// eslint-disable-next-line max-classes-per-file
import { computeTradeBucket, TradeBucket } from "@computables/trade_bucket"
import { AppDataSource } from "@datasources/datasource"
import { initTardis } from "@datasources/tardis"
import { TradePair } from "@entities/trade_pair"
import { DataSourceError } from "@lib/errors"
import { handleTypeOrmError } from "@lib/handlers/errors"
import { TradePairSymbol } from "@lib/types"
import { ensure } from "@lib/utils/ensure"
import { waitForDatasourceReady } from "@lib/utils/helpers"
import { Context, Service, ServiceBroker } from "moleculer"
import { ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import { combine, compute, Exchange, normalizeTrades, streamNormalized, Trade } from "tardis-dev"
import { InsertResult } from "typeorm"

export default class TradePairService extends Service {
  //state: ProcessingStateEnum = ProcessingStateEnum.Idle
  readonly BATCH_SIZE = 300
  readonly HIGH_WATERMARK = 200
  batchedOffset = 0
  batchedRecords: TradePair[] = new Array(this.BATCH_SIZE)
  // private datasource!: DataSource
  // private dbWriter!: InsertQueryBuilder<TradePair>
  private lastMessage?: Trade | TradeBucket
  // private cancellable?: Promise<AsyncIterableIterator<Trade | TradeBucket>> & { cancel: () => void }

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
          return waitForDatasourceReady().then(resolve).catch(reject)
        })
          .then(() => {
            const realTimeStreams = exchangePairs.map(options =>
              compute(streamNormalized(options, normalizeTrades), computeTradeBucket({ kind: "time", interval: 1000 }))
            )

            const combinedMessageStream = combine(...realTimeStreams)

            /**
             * When this promise resolves, it signals that the service is started.
             */
            this.processMessages(/*computedMessages*/ combinedMessageStream)
              .then(() => this.logger.info("Finished"))
              .catch(onError)
          })
          .catch(onError)
      },

      stopped(this: TradePairService) {
        return Promise.resolve()
      }
    })
  }

  onStreamError(err: Error): void {
    newrelic.noticeError(err, { service: this.name })
    this.logger.error("onStreamError", err)
  }

  async processMessages(messages: AsyncIterableIterator<Trade | TradeBucket>) {
    // const onTypeOrmError = this.onTypeOrmError

    // this.cancellable = this.createCancellable(messages)

    this.logger.info("start processMessages")
    for await (const message of messages) {
      if (message.type === "trade_bucket") {
        await ResultAsync.fromPromise(this.captureMessage(message), handleTypeOrmError).mapErr(
          (err: DataSourceError) => {
            this.logger.warn("ignoring insert for", message)
            this.logger.error("captureMessage Error", err)
            newrelic.incrementMetric("/TradePair/executeInsert#QueryFailedError")
          }
        )
      }
      // this.emitTradeOfLastSecond(message)
    }
  }

  // private createCancellable(messages: AsyncIterableIterator<Trade | TradeBucket>) {
  //   const state = { cancel: (err: Error) => {} }
  //   const cancelToken = new Promise<AsyncIterableIterator<Trade | TradeBucket>>((_, reject) => {
  //     state.cancel = reject
  //   })
  //   const p: Promise<AsyncIterableIterator<Trade | TradeBucket>> = Promise.race([messages, cancelToken])
  //   // let cancellable: Promise<void | AsyncIterableIterator<Trade | TradeBucket>> & { cancel: (err: Error) => void }
  //   const cancellable = _.extend(p, {
  //     cancel: () => {
  //       state.cancel(new Error("cancelled"))
  //     }
  //   })

  //   return cancellable
  // }

  private captureMessage(message: Trade | TradeBucket): Promise<InsertResult | void> {
    const { timestamp, exchange, symbol, id, price, localTimestamp } = message
    // this.logger.info(message)
    this.lastMessage = message

    return this.executeInsert({
      timestamp: message.type === "trade_bucket" ? message.closeTimestamp : timestamp,
      exchange,
      symbol: symbol as TradePairSymbol,
      id,
      price: price.toString(),
      localTimestamp
    }).catch(err => this.onStreamError(err))
    // .catch(err => {
    //   if (err instanceof QueryFailedError) {
    //     if (err.message === "duplicate key value violates unique constraint") {
    //       this.logger.info("ignore db constraint violation")
    //       newrelic.incrementMetric("/TradePair/executeInsert#QueryFailedError")
    //     }
    //   }
    //   // QueryFailedError: duplicate key value violates unique constraint
    // })
  }
  // batch() {
  //   if (this.batchedOffset > this.HIGH_WATERMARK && this.state === ProcessingStateEnum.Batch) {
  //     this.state = ProcessingStateEnum.Insert
  //     this.broker.emit("batch_insert", true) // ,opts
  //     const insertCount = this.executeInsert()
  //     this.state = ProcessingStateEnum.Batch
  //   }
  // }

  private async executeInsert(tradePair: TradePair): Promise<InsertResult> {
    return await AppDataSource.manager.createQueryBuilder().insert().into(TradePair).values([tradePair]).execute()
  }

  // private async executeUpdate(tradePair: TradePair): Promise<InsertResult> {
  //   return await AppDataSource.manager.update(TradePair, [tradePair])
  // }

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
