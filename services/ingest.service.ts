"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { ResultAsync } from "neverthrow"
import { OptionSummary } from "tardis-dev"
import { stream } from "../datasources/tardis_deribit_streams"
import config from "../configuration"
import { instrumentInfoFailure } from "../lib/errors"
import { initTardis } from "../datasources/tardis"

export default class IngestService extends Service {
  private optionStream?: AsyncIterableIterator<OptionSummary>
  /**
   * Keep a grouping of expiry dates => symbols so we can request a set of OptionSummary objects
   *
   * @private
   */
  private expiryMap = new Map<string, Set<string>>()

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "ingest",

      cacher: "Memory",

      // Settings
      settings: {
        $dependencyTimeout: 30000,
        mfiv: config.mfiv,
        tardis: config.tardis
      },
      // Metadata
      metadata: {
        scalable: true
      },
      // Dependencies
      dependencies: [
        {
          name: "instruments",
          version: 1
        }
      ],

      actions: {
        // cached: {
        //   handler(this: IngestService) {
        //     return this.broker.cacher?.
        //   }
        // },
        stats: {
          handler(this: IngestService) {
            return this.stats()
          }
        },
        expiries: {
          handler(this: IngestService) {
            return Array.from(this.expiryMap.entries())
          }
        },
        summaries: {
          params: {
            expiry: { type: "string" }
          },
          handler(this: IngestService, ctx: Context<{ expiry: string }>) {
            return this.materializeExpiries(ctx.params)
          }
        }
      },

      // created(this: IngestService) {},

      // Service methods
      async started(this: IngestService) {
        this.logger.info("Start ingest service")
        await initTardis()
        void ResultAsync.fromPromise(this.buildInstrumentInfoList(), tErr => instrumentInfoFailure(tErr as Error))
          .map(
            symbols =>
              ({
                exchange: config.tardis.exchange,
                symbols
              } as { exchange: "deribit"; symbols: string[] })
          )
          .map(stream)
          .map(messages => this.process(messages))
        this.logger.info("Ingest Running")
      }
    })
  }

  //  private ingest(ctx: Context<{ exchange: "deribit" }>) {
  // this.optionStream = this.ResultAsync.fromPromise(
  //   this.buildInstrumentInfoList(),
  //   () => new Error("buildInstrumentInfoList() unexpectedly failed")
  // )
  //   .map(symbols => ({
  //     exchange: ctx.params.exchange,
  //     symbols
  //   }))
  //   .map(stream)
  //   .unwrapOr(undefined)

  // return await ResultAsync.fromPromise(
  //   this.buildInstrumentInfoList(),
  //   () => new Error("buildInstrumentInfoList() unexpectedly failed")
  // )
  //   .map(symbols => ({
  //     exchange: ctx.params.exchange,
  //     symbols
  //   }))
  //   .map(stream)
  //   .unwrapOr(undefined) //{ done: true, next undefined}
  // .map(messages => this.process(messages))
  // .unwrapOr(false)
  // }

  // private async createStream(this: IngestService, ctx: Context<{ exchange: "deribit" }>) {
  // return await ResultAsync.fromPromise(this.buildInstrumentInfoList(), err => instrumentInfoFailure(err as Error))
  //   .map(symbols => ({
  //     exchange: ctx.params.exchange,
  //     symbols
  //   }))
  //   .map(stream)
  //   .match(
  //     (messages: AsyncIterableIterator<OptionSummary>) => {
  //       this.messages = messages
  //       return "Ready to stream"
  //     },
  //     (error: Error) => error.message
  //   )
  // return result.then((res: Result<AsyncIterableIterator<OptionSummary>, Error>) => {
  //   if (res.isErr()) {
  //     console.log("Oops, at least one step failed", res.error)
  //   } else {
  //     console.log("User has been validated, inserted and notified successfully.")
  //   }
  // })
  // .then(messages => {
  //   if (messages.isErr()) {
  //     this.logger.fatal(messages.error)
  //     throw messages.error
  //   } else {
  //     this.optionStream = messages.value
  //   }
  //   return this.optionStream
  // })
  // return ResultAsync.fromPromise(this.buildInstrumentInfoList(), err => instrumentInfoFailure(err as Error))
  //   .map(symbols => ({
  //     exchange: ctx.params.exchange,
  //     symbols
  //   }))
  //   .map(stream)
  //   .match(
  //     (messages: AsyncIterableIterator<OptionSummary>) => {
  //       this.messages = messages
  //       return messages
  //     },
  //     (error: Error) => {
  //       if (!error.name.startsWith("Failure") {
  //         createStreamFailure(error)
  //       } else {
  //       }
  //     }
  //   )
  // .andThen(messages => {
  //   this.messages = messages
  // })
  // .map.match(
  //   messages => (this.messages = messages),
  //   err => createStreamFailure(err)
  // )
  // .unwrapOr(createStreamFailure)
  // .match(messages => (this.optionStream = messages), instrumentInfoFailure)
  // .match((messages: AsyncIterableIterator<OptionStream>) => (this.optionStream = messages), instrumentInfoFailure)
  // .unwrapOr(instrumentInfoFailure)
  // }

  private async process(messages: AsyncIterableIterator<OptionSummary>) {
    this.logger.info("Process(messages)")

    for await (const message of messages) {
      // this.logger.info(message)
      // Save to cache
      this.cacheMessage(message)
    }

    return true
  }

  /**
   * Keep a cached list of option prices. This is a sideband operation
   * that does not await the promise.
   * @param o - OptionSummary to cache
   */
  private cacheMessage(o: OptionSummary): void {
    const expiryKey = o.expirationDate.toISOString()
    if (!this.expiryMap.has(expiryKey)) {
      this.logger.info("Create cache set", expiryKey)
      this.expiryMap.set(expiryKey, new Set<string>())
    }
    const expirySet = this.expiryMap.get(expiryKey)
    expirySet?.add(o.symbol)
    void this.broker.cacher?.set(o.symbol, o)
  }

  private materializeExpiries({ expiry }: { expiry: string }) {
    if (!this.expiryMap.has(expiry)) {
      this.logger.error(
        `The expiry (${expiry}) was requested but has not been cached. ` +
          "Check that caching is enabled and check that the expiry date matches an existing intrument's expirationDate."
      )
      return []
    }

    const symbolList = this.expiryMap.get(expiry)
    if (!symbolList) {
      return
    }

    return Array.from(symbolList.values()).map(async key => (await this.broker.cacher?.get(key)) as OptionSummary[])
  }

  private async buildInstrumentInfoList(this: IngestService): Promise<string[]> {
    this.logger.info("buildInstrumentInfoList()")
    return await this.broker.call("v1.instruments.instrumentInfo", {
      timestamp: new Date().toISOString(),
      ...this.settings.mfiv
    })
  }

  private stats() {
    return {
      expirySets: this.expiryMap.size
    }
  }
}
