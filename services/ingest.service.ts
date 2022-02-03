// "use strict"
import { Context, Service, ServiceBroker } from "moleculer"
//#region Global Imports
import { combine, ResultAsync } from "neverthrow"
import { Exchange, OptionSummary, StreamNormalizedOptions } from "tardis-dev"
import { chainFrom } from "transducist"
//#endregion Global Imports

import configuration from "@configuration"
import { initTardis, stream } from "@datasources"
import { insufficientDataError } from "@lib/errors"
import { handleError } from "@lib/handlers/errors"

//#region Local Imports
//#endregion Local Imports

//#region Interface Imports
import { IIngest, IInstrumentInfo } from "@interfaces"
import { mfivDates } from "src/lib/expiries"
import { MethodologyExpiryEnum } from "@entities"
//#endregion Interface Imports

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
      name: "ingest",

      cacher: "Memory",

      // Settings
      settings: {
        $dependencyTimeout: 30000,
        expiryType: MethodologyExpiryEnum.FridayT08
      },
      // Metadata
      metadata: {
        scalable: true
      },
      // Dependencies
      dependencies: [
        {
          name: "instrument_info"
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
          async handler(
            this: IngestService,
            ctx: Context<IIngest.OptionSummariesParams>
          ): Promise<IIngest.OptionSummariesResponse> {
            const optionSummaryByExpiry = await this.fetchOptionSummaries(ctx.params)

            if (optionSummaryByExpiry.isOk()) {
              return Promise.resolve(optionSummaryByExpiry.value)
            } else {
              return Promise.reject(optionSummaryByExpiry.error)
            }
          }
        }
      },

      // Service methods
      async started(this: IngestService) {
        await initTardis()
        this.ingest()
      }
    })
  }

  ingest(this: IngestService) {
    const expiries = mfivDates(new Date(), "14d", MethodologyExpiryEnum.FridayT08)
    return void ResultAsync.fromPromise(this.fetchInstruments(expiries), handleError)
      .map(streamNormalizedOptions({ exchange: configuration.tardis.exchange }))
      .map(stream)
      .map(this.process.bind(this))
      .mapErr(err => console.error("error", err))
  }

  private async process(messages: AsyncIterableIterator<OptionSummary>) {
    for await (const message of messages) {
      // Track the latest message
      this.latestMessage = message

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
      this.logger.info("Cache Miss", expiryKey)
      this.expiryMap.set(expiryKey, new Set<string>())
    }
    const expirySet = this.expiryMap.get(expiryKey)
    expirySet?.add(o.symbol)
    void this.broker.cacher?.set(
      o.symbol,
      summaryWithDefaults(o, { bestAskPrice: 0, bestBidPrice: 0, underlyingPrice: 0 })
    )
  }

  private async fetchOptionSummaries(params: IIngest.OptionSummariesParams) {
    const cacher = this.broker.cacher
    if (cacher === undefined) {
      throw new Error("Cache should not be disabled")
    }

    const symbolList = this.expiryMap.get(params.expiry)
    if (!symbolList) {
      throw insufficientDataError("Expiry is missing from expiry map.", [
        `The requested expiry '${params.expiry}' has not been seen yet`,
        "Check that the expiry date matches an existing intrument's expirationDate."
      ])
    } else {
      return await combine(
        chainFrom(Array.from(symbolList.values()))
          .map(sym => ResultAsync.fromPromise(cacher.get(sym) as Promise<OptionSummary>, handleError))
          .toArray()
      )
    }
  }

  private async fetchInstruments(expiries: { nearExpiration: string; nextExpiration: string }): Promise<string[]> {
    const expirationDates = [expiries.nearExpiration, expiries.nextExpiration]
    return this.broker.call("instrument_info.instrumentInfo", {
      expirationDates,
      timestamp: new Date().toISOString(),
      ...this.settings.mfiv
    })
  }

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
  return (symbols: IInstrumentInfo.InstrumentInfoResponse) => ({
    exchange,
    symbols,
    onError
  })
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
