import { initTardis } from "@datasources/tardis"
import { TardisInstrumentInfoFilter, tardisOptionInstrumentDataSource } from "@datasources/tardis_instrument_datasource"
import { IInstrumentInfo } from "@interfaces/services/instrument_info"
import { ensure } from "@lib/utils/ensure"
import { parseContractType } from "@lib/utils/helpers"
import * as _ from "lodash"
import { Context, Service, ServiceBroker } from "moleculer"
import { MFIV_ASSETS } from "node-volatility-mfiv"
// import * as Cron from "moleculer-cron"
import { InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"
import { PartialInstrumentInfo } from "./../src/lib/types"

export default class InstrumentInfoService extends Service {
  private instrumentInfos: PartialInstrumentInfo[] = []
  private lastUpdatedAt?: Date

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: ensure("SERVICE_NAME", "instrument_info"),

      // Settings
      settings: {
        refreshDefaults: {
          exchange: ensure("INSTRUMENT_INFO_REFRESH_EXCHANGE", "deribit"),
          asset: ensure("INSTRUMENT_INFO_REFRESH_BASE_CURRENCY"),
          type: ensure("INSTRUMENT_INFO_REFRESH_TYPE ", "option"),
          contractType: parseContractType(process.env.INSTRUMENT_INFO_REFRESH_CONTRACT_TYPE, [
            "call_option",
            "put_option"
          ]),
          expirationDates: [],
          timestamp: undefined
          // active: false
        } as IInstrumentInfo.InstrumentInfoParams
      },
      // Metadata
      metadata: {},
      // Dependencies
      dependencies: [],

      // mixins: [Cron],

      // crons: [
      //   {
      //     name: "InstrumentInfoRefresh",
      //     cronTime: process.env.INSTRUMENT_INFO_REFRESH_CRONTIME,
      //     onTick: () => {
      //       console.log("InstrumentInfo doRefresh()")
      //       // const result = await this.actions.risklessRate({ source: this.settings.risklessRateSource })
      //       // this.logger.info("aave rate", result)
      //       // await this.broker.broadcast("rate.updated", result, ["index"])
      //     },
      //     timeZone: "UTC"
      //   }
      // ],

      // Actions
      actions: {
        refreshInstrumentInfos: {
          visibility: "public",
          params: {
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            asset: { type: "string", enum: MFIV_ASSETS },
            type: { type: "string", enum: ["option"], default: "option" },
            contractType: { type: "array", items: "string", default: ["call_option", "put_option"] }
          },
          handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.RefreshParams>
          ): Promise<IInstrumentInfo.RefreshResponse> {
            this.logger.info("refresh", ctx.params)
            return Promise.resolve(this.fetchInstruments({ ...ctx.params, expirationDates: [] }))
          }
        },
        instrumentInfo: {
          visibility: "public",
          // TODO: Enable caching to this action
          cache: {
            // These cache entries will be expired after 5 seconds instead of 30.
            ttl: 60 * 5
          },
          params: {
            timestamp: { type: "string" },
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            asset: { type: "string", enum: MFIV_ASSETS },
            type: { type: "string", enum: ["option"], default: "option" },
            contractType: { type: "array", items: "string", default: ["call_option", "put_option"] },
            active: { type: "boolean", default: true },
            expirationDates: { type: "array", items: "string", minSize: 1 }
          },
          handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.InstrumentInfoParams>
          ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
            this.logger.info("instrumentInfo", ctx.params)
            return Promise.resolve(this.fetchAvailableInstruments(ctx.params))
          }
        },
        available: {
          visibility: "public",
          // TODO: Enable caching to this action
          cache: {
            // These cache entries will be expired after 5 seconds instead of 30.
            ttl: 60 * 5
          },
          params: {
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            asset: { type: "string", enum: MFIV_ASSETS }
          },
          handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.AvailableParams>
          ): Promise<IInstrumentInfo.AvailableResponse> {
            this.logger.info("available", ctx.params)
            return this.fetchAvailable(ctx.params)
          }
        }
      },

      started(this: InstrumentInfoService) {
        initTardis()

        if (this.settings?.refreshDefaults === undefined) {
          throw new Error("Settings have not been set yet. Check that `refreshDefaults` has been declared in settings.")
        }

        const refreshDefaults = this.settings.refreshDefaults as IInstrumentInfo.InstrumentInfoParams

        /**
         * Prime the cache with a fresh request
         */
        return new Promise<void>((resolve, reject) => {
          this.refresh(refreshDefaults)
            .then(() => resolve())
            .catch(reject)
        })
      }
    })
  }

  /**
   * Refresh the internal collection of PartialInstrumentInfo
   *
   * @param params
   * @returns
   */
  private async refresh(params: IInstrumentInfo.InstrumentInfoParams) {
    return this.fetchInstruments(params)
  }

  private async fetchInstruments(
    this: InstrumentInfoService,
    params: IInstrumentInfo.InstrumentInfoParams
  ): Promise<PartialInstrumentInfo[]> {
    this.logger.info("fetchInstruments", params)
    const toPartialInstrumentInfo = (info: InstrumentInfo): PartialInstrumentInfo => {
      const { baseCurrency, ...partial } = info
      const transformed = { ...partial, asset: baseCurrency }

      return _.pick(transformed, [
        "id",
        "exchange",
        "asset",
        "type",
        "active",
        "availableTo",
        "availableSince",
        "optionType",
        "expiry"
      ]) as PartialInstrumentInfo
    }
    this.instrumentInfos = chainFrom(await tardisOptionInstrumentDataSource({ ...params, baseCurrency: params.asset }))
      .map(toPartialInstrumentInfo)
      .toArray()
    this.lastUpdatedAt = new Date()
    this.logger.info(`found ${this.instrumentInfos.length} instruments`)
    return this.instrumentInfos
  }

  /**
   * Find the ids of the available InstrumentInfos based on the params context
   * @param params
   * @returns string[]
   */
  private fetchAvailableInstruments(params: IInstrumentInfo.InstrumentInfoParams): string[] {
    const timestamp = params.timestamp as string
    const Available = (item: PartialInstrumentInfo) =>
      item.availableSince <= timestamp && item.availableTo ? item.availableTo > timestamp : true

    this.logger.info(`fetching available instruments for ${timestamp}`, params)

    const availableInstruments = chainFrom(this.instrumentInfos)
      .filter(Available)
      .filter(item => !!item.expiry && params.expirationDates.includes(item.expiry))
      .map(item => item.id)
      .toArray()

    this.logger.info(`Found ${availableInstruments.length} available instruments`, availableInstruments)

    return availableInstruments
  }

  private async fetchAvailable(params: IInstrumentInfo.AvailableParams): Promise<string[]> {
    this.logger.info("fetch available instruments", params)
    const tardisParams: TardisInstrumentInfoFilter = {
      exchange: params.exchange,
      baseCurrency: params.asset,
      contractType: ["call_option", "put_option"],
      type: "option"
    }
    const available = chainFrom(await tardisOptionInstrumentDataSource(tardisParams))
      .map(item => item.id)
      .toArray()

    this.logger.info(`Found ${available.length} available instruments`, available)

    return available
  }
}
