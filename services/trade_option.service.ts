/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// eslint-disable-next-line max-classes-per-file
import { computeOptionBucket, OptionBucket } from "@computables/option_bucket"
import { AppDataSource } from "@datasources/datasource"
import { initTardis } from "@datasources/tardis"
import { TradeOption } from "@entities/trade_option"
import { DataSourceError } from "@lib/errors"
import { handleTypeOrmError } from "@lib/handlers/errors"
import { TradePairSymbol } from "@lib/types"
import { ensure } from "@lib/utils/ensure"
import { waitForDatasourceReady } from "@lib/utils/helpers"
import { Context, Service, ServiceBroker } from "moleculer"
import { ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import { compute, getInstrumentInfo, normalizeOptionsSummary, OptionSummary, streamNormalized } from "tardis-dev"
import { InsertResult } from "typeorm"
import { OptionTypeEnum } from "./../src/entities/types"

export default class TradeOptionService extends Service {
  //state: ProcessingStateEnum = ProcessingStateEnum.Idle
  readonly BATCH_SIZE = 300
  readonly HIGH_WATERMARK = 200
  batchedOffset = 0
  batchedRecords: TradeOption[] = new Array(this.BATCH_SIZE)
  private lastMessage?: OptionSummary | OptionBucket
  private latest: Map<string, TradeOption> = new Map<string, TradeOption>()

  // @ts-ignore
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: ensure("SERVICE_NAME", "tradeoption"),

      settings: {
        $dependencyTimeout: 60000,

        skipPersist: process.env.OPTION_SKIP_PERSIST === "true",

        tradeOptionAsset: ensure("TRADE_OPTION_ASSET")
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
          handler(this: TradeOptionService, ctx: Context) {
            return Promise.resolve(this.lastMessage)
          }
        },

        latest: {
          visibility: "public",
          rest: "GET /latest",
          // rest: `GET /${ensure("TRADE_OPTION_ASSET").toLowerCase()
          handler(this: TradeOptionService, ctx: Context) {
            return Promise.resolve(this.getLatest())
          }
        }
      },

      /**
       * Methods
       */
      methods: {
        getLatest: () => {
          return Array.from(this.latest.values())
        }
      },

      /**
       * Service created lifecycle event handler
       */
      started(this: TradeOptionService) {
        const onError = (err: Error) => this.onStreamError(err)

        initTardis()

        /**
         * This promise will be used to resolve the `started` event in moleculer.service
         */
        return new Promise<void>((resolve, reject) => {
          return waitForDatasourceReady().then(resolve).catch(reject)
        })
          .then(async () => {
            const optionIds = await this.buildOptionLists()
            this.logger.info("number of active options", optionIds)
            return optionIds
          })
          .then((optionIds: string[]) => {
            const realTimeStreams = compute(
              streamNormalized(
                {
                  exchange: "deribit",
                  symbols: optionIds /*.slice(0, 5)*/
                },
                // normalizeTrades
                normalizeOptionsSummary
              ),
              computeOptionBucket({ kind: "time", interval: 1000 })
            )

            this.processMessages(/*computedMessages*/ realTimeStreams)
              .then(() => this.logger.info("Finished"))
              .catch(onError)

            // const combinedMessageStream = combine(...realTimeStreams)

            /**
             * When this promise resolves, it signals that the service is started.
             */
            // this.processMessages(/*computedMessages*/ combinedMessageStream)
            //   .then(() => this.logger.info("Finished"))
            //   .catch((err: unknown) => this.onStreamError(err as Error))
          })
          .catch(onError)
      },

      stopped(this: TradeOptionService) {
        return Promise.resolve()
      }
    })
  }

  onStreamError(err: Error): void {
    newrelic.noticeError(err, { service: this.name })
    this.logger.error("onStreamError", err)
  }

  async processMessages(messages: AsyncIterableIterator<OptionSummary | OptionBucket>) {
    // const onTypeOrmError = this.onTypeOrmError

    // this.cancellable = this.createCancellable(messages)

    this.logger.info("start processMessages")
    for await (const message of messages) {
      if (message.type === "option_bucket") {
        this.logger.debug(message)
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

  private captureMessage(message: OptionSummary | OptionBucket): Promise<InsertResult | void> {
    const { timestamp, exchange, symbol, localTimestamp } = message
    this.lastMessage = message

    if (message.type === "option_summary") {
      return this.executeInsert({
        asset: this.settings.tradeOptionAsset,
        timestamp,
        exchange,
        symbol: symbol as TradePairSymbol,
        localTimestamp,
        strikePrice: message.strikePrice,
        expirationDate: message.expirationDate,
        price: message.lastPrice?.toString() ?? "0",
        underlyingPrice: message.underlyingPrice?.toString() ?? "0",
        optionType: message.optionType as OptionTypeEnum,
        markIV: message.markIV?.toString() ?? "0",
        delta: message.delta?.toString() ?? "0"
      }).catch(err => this.onStreamError(err))
    } else if (message.type === "option_bucket") {
      const data = {
        asset: this.settings.tradeOptionAsset,
        timestamp,
        exchange,
        symbol: symbol as TradePairSymbol,
        localTimestamp,
        strikePrice: message.strikePrice,
        expirationDate: message.expirationDate,
        price: message.lastPrice?.toString() ?? "0",
        underlyingPrice: message.underlyingPrice?.toString() ?? "0",
        optionType: message.optionType as OptionTypeEnum,
        markIV: message.markIV?.toString() ?? "0",
        delta: message.delta?.toString() ?? "0"
      }

      this.latest.set(symbol, data)

      return this.executeInsert(data).catch(err => this.onStreamError(err))
    }

    return Promise.resolve(undefined)
  }
  // batch() {
  //   if (this.batchedOffset > this.HIGH_WATERMARK && this.state === ProcessingStateEnum.Batch) {
  //     this.state = ProcessingStateEnum.Insert
  //     this.broker.emit("batch_insert", true) // ,opts
  //     const insertCount = this.executeInsert()
  //     this.state = ProcessingStateEnum.Batch
  //   }
  // }

  private async executeInsert(tradeOption: TradeOption): Promise<InsertResult> {
    return await AppDataSource.manager.createQueryBuilder().insert().into(TradeOption).values([tradeOption]).execute()
  }

  private async buildOptionLists(): Promise<string[]> {
    const instruments = await getInstrumentInfo("deribit", {
      type: "option",
      baseCurrency: this.settings.tradeOptionAsset,
      active: true
    })

    const optionList = []

    for (const instrument of instruments) {
      if (instrument.expiry === undefined) {
        continue
      }

      optionList.push(instrument.id)
    }

    return optionList
  }
}
