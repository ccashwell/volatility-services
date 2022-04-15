// "use strict"
import { initTardis, stream } from "@datasources"
import { MethodologyExpiryEnum } from "@entities"
import { IIngest, IInstrumentInfo } from "@interfaces"
import { insufficientDataError } from "@lib/errors"
import { mfivDates } from "@lib/expiries"
import { handleError } from "@lib/handlers/errors"
import { ensure } from "@lib/utils/ensure"
import { parseContractType } from "@lib/utils/helpers"
import { instrumentInfos } from "@service_helpers/instrument_info_helper"
import { Context, Service, ServiceBroker } from "moleculer"
import { combine, ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import { Asset } from "node-volatility-mfiv"
import { Exchange, OptionSummary, StreamNormalizedOptions } from "tardis-dev"
import { chainFrom } from "transducist"
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
      // dependencies: ["instrument_info-btc"],

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

            if (optionSummaryByExpiry.isOk()) {
              return Promise.resolve(optionSummaryByExpiry.value)
            } else {
              return Promise.reject(optionSummaryByExpiry.error)
            }
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

  private async fetchInstruments(
    expiries: { nearExpiration: string; nextExpiration: string },
    { asset }: { asset: Asset }
  ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
    const expirationDates = [expiries.nearExpiration, expiries.nextExpiration]
    this.logger.info("Fetching instruments with expiries", expirationDates)

    return instrumentInfos(this, {
      expirationDates,
      timestamp: new Date().toISOString(),
      ...this.settings.instrumentInfoDefaults,
      asset
    })
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
