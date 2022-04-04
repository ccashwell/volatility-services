import { initTardis } from "@datasources/tardis"
import { tardisOptionInstrumentDataSource } from "@datasources/tardis_instrument_datasource"
import { IInstrumentInfo } from "@interfaces/services/instrument_info"
import { PartialInstrumentInfo } from "@lib/types"
import * as _ from "lodash"
import { Context, Service, ServiceBroker } from "moleculer"
// import * as Cron from "moleculer-cron"
import { InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"

export default class InstrumentInfoService extends Service {
  private instrumentInfos: PartialInstrumentInfo[] = []
  private lastUpdatedAt?: Date

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "instrument_info",

      // Settings
      settings: {},
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
        refresh: {
          visibility: "public",
          params: {
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            baseCurrency: { type: "string", enum: ["ETH", "BTC"], default: "ETH" },
            type: { type: "string", enum: ["option"], default: "option" },
            contractType: { type: "array", items: "string", default: ["call_option", "put_option"] }
          },
          handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.RefreshParams>
          ): Promise<IInstrumentInfo.RefreshResponse> {
            this.logger.info("/refresh called")
            return Promise.resolve(this.fetchInstruments({ ...ctx.params, expirationDates: [] }))
          }
        },
        instrumentInfo: {
          visibility: "public",
          // TODO: Enable caching to this action
          cache: {
            // These cache entries will be expired after 5 seconds instead of 30.
            ttl: 30
          },
          params: {
            timestamp: { type: "string" },
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            baseCurrency: { type: "string", enum: ["ETH", "BTC"], default: "ETH" },
            type: { type: "string", enum: ["option"], default: "option" },
            contractType: { type: "array", items: "string", default: ["call_option", "put_option"] },
            active: { type: "boolean", default: true },
            expirationDates: { type: "array", items: "string", minSize: 1 }
          },
          handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.InstrumentInfoParams>
          ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
            this.logger.info("/instruments called", ctx.params)
            return Promise.resolve(this.fetchAvailableInstruments(ctx.params))
          }
        }
      },

      async started() {
        initTardis()

        return Promise.resolve()
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
    this.logger.info("fetchInstruments()", params)
    const toPartialInstrumentInfo = (info: InstrumentInfo): PartialInstrumentInfo => {
      return _.pick(info, [
        "id",
        "exchange",
        "baseCurrency",
        "type",
        "active",
        "availableTo",
        "availableSince",
        "optionType",
        "expiry"
      ])
    }
    const instruments = await tardisOptionInstrumentDataSource(params)
    this.instrumentInfos = chainFrom(instruments).map(toPartialInstrumentInfo).toArray()
    this.lastUpdatedAt = new Date()
    return instruments
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

    // chainFrom begins a transducer which reduces the instruments from the exchange
    return chainFrom(this.instrumentInfos)
      .filter(Available)
      .filter(item => !!item.expiry && params.expirationDates.includes(item.expiry))
      .map(item => item.id)
      .toArray()
  }
}
