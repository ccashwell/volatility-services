"use strict"
import { initTardis } from "@datasources/tardis"
import { tardisOptionInstrumentDataSource } from "@datasources/tardis_instrument_datasource"
import { IInstrumentInfo } from "@interfaces/services/instrument_info"
import { Context, Service, ServiceBroker } from "moleculer"
import { InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"

export default class InstrumentInfoService extends Service {
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

      // Actions
      actions: {
        instrumentInfo: {
          params: {
            timestamp: { type: "string" },
            exchange: { type: "string", enum: ["deribit"], default: "deribit" },
            baseCurrency: { type: "string", enum: ["ETH"], default: "ETH" },
            // quoteCurrency: { type: "string", enum: ["ETH"] },
            type: { type: "string", enum: ["option"], default: "option" },
            contractType: { type: "array", items: "string", default: ["call_option", "put_option"] },
            active: { type: "boolean", default: true },
            expirationDates: { type: "array", items: "string" }
          },
          rest: "/instruments",
          // Enable caching to this action
          cache: {
            // These cache entries will be expired after 5 seconds instead of 30.
            ttl: 30
          },
          async handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.InstrumentInfoParams>
          ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
            this.logger.info("/instruments called", ctx.params)
            return await this.fetchInstruments(ctx.params)
          }
        }
      },

      async started() {
        initTardis()
        return Promise.resolve()
      }
    })
  }

  public async fetchInstruments(
    this: InstrumentInfoService,
    params: IInstrumentInfo.InstrumentInfoParams
  ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
    this.logger.info("fetchInstruments()", params)

    const Available = (item: InstrumentInfo) =>
      item.availableSince <= params.timestamp && item.availableTo ? item.availableTo > params.timestamp : true

    // chainFrom begins a transducer which reduces the instruments from the exchange
    return chainFrom(await this.fetchActiveInstruments(params))
      .filter(Available)
      .filter(item => !!item.expiry && params.expirationDates.includes(item.expiry))
      .map(item => item.id)
      .toArray()
  }

  private async fetchActiveInstruments(params: IInstrumentInfo.InstrumentInfoParams) {
    return await tardisOptionInstrumentDataSource(params)
  }
}
