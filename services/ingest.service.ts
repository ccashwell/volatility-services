// "use strict"
import { initTardis, stream } from "@datasources"
import { MethodologyExpiryEnum } from "@entities"
import { IIngest, IInstrumentInfo } from "@interfaces"
import { mfivDates } from "@lib/expiries"
import { handleError } from "@lib/handlers/errors"
import { ensure } from "@lib/utils/ensure"
import { parseContractType } from "@lib/utils/helpers"
import { instrumentInfos } from "@service_helpers/instrument_info_helper"
import _ from "lodash"
import { Context, Service, ServiceBroker } from "moleculer"
import { ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import { Asset } from "node-volatility-mfiv"
import { Exchange, OptionSummary, StreamNormalizedOptions } from "tardis-dev"
import configuration from "../src/configuration"

export default class IngestService extends Service {
  private latestMessage?: OptionSummary

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
      name: ensure("SERVICE_NAME", "ingest"),

      // Settings
      settings: {
        $dependencyTimeout: 60000 * 5,

        expiryType: MethodologyExpiryEnum.FridayT08,

        instrumentInfoDefaults: {
          exchange: process.env.INGEST_EXCHANGE || "deribit",
          asset: process.env.INGEST_BASE_CURRENCY,
          type: process.env.INGEST_TYPE || "option",
          timePeriod: process.env.INGEST_TIME_PERIOD || "14D",
          contractType: parseContractType(process.env.INGEST_CONTRACT_TYPE)
        }
      },

      // Metadata
      metadata: {
        scalable: true
      },

      // Dependencies
      dependencies: ["instrument_info-eth", "instrument_info-btc"],

      actions: {
        // cached: {
        //   handler(this: IngestService) {
        //     return this.broker.cacher?.
        //   }
        // },
        stats: {
          visibility: "public",
          handler(this: IngestService) {
            return this.stats()
          }
        },
        expiries: {
          visibility: "public",
          handler(this: IngestService) {
            return Array.from(this.expiryMap.entries())
          }
        },
        summaries: {
          visibility: "public",
          cache: {
            ttl: 120
          },
          params: {
            expiry: { type: "string" }
          },
          async handler(
            this: IngestService,
            ctx: Context<IIngest.OptionSummariesParams>
          ): Promise<IIngest.OptionSummariesResponse> {
            this.logger.info("fetching", ctx.params)

            const optionSummaryByExpiry = await this.fetchOptionSummaries(ctx.params)

            return optionSummaryByExpiry
            // if (optionSummaryByExpiry.isOk()) {
            //   return Promise.resolve(optionSummaryByExpiry.value)
            // } else {
            //   return Promise.reject(optionSummaryByExpiry.error)
            // }
          }
        }
      },

      // Service methods
      started(this: IngestService) {
        const { asset } = this.settings.instrumentInfoDefaults as { asset: Asset }
        initTardis()
        return new Promise((resolve, reject) => {
          this.ingest({ asset }, resolve, reject)
        })
      }
    })
  }

  ingest(
    this: IngestService,
    { asset }: { asset: Asset },
    resolve: (value: void | Promise<void>) => void,
    reject: (reason?: unknown) => void
  ) {
    // Construct the parameters necessary to get the instrument's ids for the call to streamNormalized
    const expiries = mfivDates(
      new Date(),
      this.settings.instrumentInfoDefaults.timePeriod,
      MethodologyExpiryEnum.FridayT08
    )

    return void ResultAsync.fromPromise(this.fetchInstruments(expiries, { asset }), handleError)
      .map(streamNormalizedOptions({ exchange: configuration.tardis.exchange }))
      .map(stream)
      .mapErr(err => {
        this.logger.fatal(err)
        reject(err)
        return err
      })
      .map(messages => {
        resolve() // Let the service know we can start
        return this.process(messages)
      })
      .mapErr(err => {
        this.logger.fatal(err)
        if (err instanceof Error) {
          newrelic.noticeError(err, { serviceName: "ingest", expiries: JSON.stringify(expiries) })
        }
        return err
      })
  }

  private async process(messages: AsyncIterableIterator<OptionSummary>): Promise<boolean> {
    for await (const message of messages) {
      // Track the latest message
      this.latestMessage = message

      // Save to cache
      await this.cacheMessage(message)

      // this.broker.broadcast("MFIV.14D.ETH.expiry", message, ["ws"]).catch(handleAsMoleculerError)
    }

    return true
  }

  /**
   * Keep a cached list of option prices. This is a sideband operation
   * that does not await the promise.
   *
   * @remark TODO: Use ioredis mset
   *
   * @param o - OptionSummary to cache
   */
  private async cacheMessage(o: OptionSummary): Promise<void> {
    const expiryKey = o.expirationDate.toISOString()
    if (!this.expiryMap.has(expiryKey)) {
      this.logger.info("Cache Miss", expiryKey)
      // TODO: Should probably be ingesting into a Red-Black Tree
      this.expiryMap.set(expiryKey, new Set<string>())
    }
    const expirySet = this.expiryMap.get(expiryKey)
    expirySet?.add(o.symbol)
    if (this.broker.cacher) {
      await this.broker.cacher.set(
        o.symbol,
        summaryWithDefaults(o, { bestAskPrice: 0, bestBidPrice: 0, underlyingPrice: 0 })
      )
    }
  }

  private async fetchOptionSummaries(params: IIngest.OptionSummariesParams) {
    const symbolList = this.expiryMap.get(params.expiry)
    const symbols = Array.from(symbolList?.values() ?? [])

    // this.logger.info("Fetching symbols:", symbols)

    const promises = symbols.map(sym => {
      if (this.broker.cacher) {
        return this.broker.cacher.get(sym) as Promise<OptionSummary | null>
      }

      return Promise.resolve(null)
    })

    const cacheValues = await Promise.all(promises)
    return _.compact(cacheValues)
    // const optionSummaries = symbols.reduce(async (prev: OptionSummary[], curr: string, idx: number, arr: string[]) => {
    //   if (this.broker.cacher) {
    //     const promise = this.broker.cacher.get(curr) as Promise<OptionSummary | null>
    //     const val = await promise
    //     if (val) {
    //       prev.push(val)
    //     }
    //     // const optionSummary = await promise
    //     // return Promise.resolve(optionSummary)
    //     //prev.push()
    //     // promise.then(optionSummaryOrNull => )
    //     // if (optionSummary) {
    //     //   prev.push(optionSummary)
    //     // }
    //   }

    //   return prev
    // }, [] as OptionSummary[])

    // return optionSummaries
    // symbols.map(symbol => )
    // this.broker.cacher?.get(
    // const cacher = this.broker.cacher
    // if (cacher === undefined) {
    //   throw new Error("Cache should not be disabled")
    // }

    // const readOptionSummaryCacheFn =
    //   (cache: Moleculer.Cachers.Base) =>
    //   (key: string): Promise<OptionSummary | null> => {
    //     return cache.get(key).then(value => (value === null ? null : (value as OptionSummary)))
    //   }

    // const readOptionSummaryCache = readOptionSummaryCacheFn(cacher)
    // // const foo = await combine(readOptionSummaryCache)
    // // const readOptionSummaryCache = async (key: string): Promise<OptionSummary> => {
    // //   return ResultAsync.fromPromise(cacher.get(key) as Promise<OptionSummary>, () => {
    // //     return new Error(`reading ${key} threw an error`)
    // //   })
    // // }
    // const symbolList = this.expiryMap.get(params.expiry)
    // const symbols = Array.from(symbolList?.values() ?? [])

    // this.logger.info("symbolList length", symbols.length)
    // this.logger.info("symbolList", symbols)

    // if (symbols.length === 0) {
    //   throw insufficientDataError("Expiry is missing from expiry map.", [
    //     `The requested expiry '${params.expiry}' has not been seen yet`,
    //     "Check that the expiry date matches an existing intrument's expirationDate."
    //   ])
    // } else {
    //   const optionSummaries = Promise.all(symbols.map(readOptionSummaryCache)).then(optionSummaryOrNull =>
    //     _.compact(optionSummaryOrNull)
    //   )

    //   return optionSummaries
    // return
    // const optionSummaries = symbols.map(readOptionSummaryCache)
    // this.broker.cacher.get(symbol)
    // for await (const sym of symbolList.values()) {
    //   const option = (await this.broker.cacher?.get(sym)) as OptionSummary | undefined
    //   if (option !== undefined) {
    //     options.push(option)
    //   }
    // }
    // return optionSummaries
    // const promises = combine(
    //   chainFrom(Array.from(symbolList.values()))
    //     .map(sym => {
    //       if (!cacher) {
    //         throw new Error("Cache should not be disabled")
    //       }
    //       this.logger.info("sym key", sym)
    //       return ResultAsync.fromPromise(
    //         cacher.get(sym) as Promise<OptionSummary>,
    //         () => new Error(`Could not load ${sym}`)
    //       )
    //       // return ResultAsync.fromPromise(cacher.get(sym) as Promise<OptionSummary>, handleError)
    //     })
    //     .toArray()
    // )
    // return await promises
    // return (await promises).isOk
    // return await combine(
    //   chainFrom(Array.from(symbolList.values()))
    //     .map(sym => ResultAsync.fromPromise(this.broker.cacher.get(sym) as Promise<OptionSummary>, handleError))
    //     .toArray()
    // )
  }

  private async fetchInstruments(
    expiries: { nearExpiration: string; nextExpiration: string },
    { asset }: { asset: Asset }
  ): Promise<string[]> {
    const expirationDates = [expiries.nearExpiration, expiries.nextExpiration]
    this.logger.info("Fetching instruments with expiries", expirationDates)

    return instrumentInfos(this, {
      expirationDates,
      timestamp: new Date().toISOString(),
      ...this.settings.instrumentInfoDefaults,
      asset
    } as IInstrumentInfo.InstrumentInfoParams)
  }

  /**
   * Small helper method to output what's going on if needed.
   * @returns
   */
  private stats() {
    return {
      clock: new Date().toISOString(),
      expirySets: this.expiryMap.size,
      latest: this.latestMessage
    }
  }
}

export function streamNormalizedOptions<E extends Exchange>({
  exchange,
  onError = err => console.error(err)
}: StreamNormalizedOptions<E>) {
  return (symbols: IInstrumentInfo.InstrumentInfoResponse) => {
    return {
      exchange,
      symbols,
      onError
    }
  }
}

/**
 * OptionSummary data can have undefined price values. When this happens,
 * set price to defaults.
 *
 * @private
 *
 * @param o - option summary to override with defaults
 * @param { vals } - default values to be set in OptionSummary
 * @returns OptionSummary w/required price values
 */
const summaryWithDefaults = (
  o: OptionSummary,
  { bestAskPrice, bestBidPrice, underlyingPrice }: DefaultOptionSummary
) => ({
  ...o,
  bestAskPrice: o.bestAskPrice ?? bestAskPrice,
  bestBidPrice: o.bestBidPrice ?? bestBidPrice,
  underlyingPrice: o.underlyingPrice ?? underlyingPrice
})

interface DefaultOptionSummary {
  bestAskPrice: number
  bestBidPrice: number
  underlyingPrice: number
}
