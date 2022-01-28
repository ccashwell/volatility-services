"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { Exchange, InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"
import { BaseCurrency, MfivWindow } from "@lib/types"
import { IInstrumentInfo } from "@interfaces/services/instrument_info"
import { initTardis } from "@datasources/tardis"
import { tardisOptionInstrumentDataSource } from "@datasources/tardis_instrument_datasource"

export default class InstrumentInfoService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "instrument_info",

      cacher: "Memory",

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
          cache: true,
          async handler(
            this: InstrumentInfoService,
            ctx: Context<IInstrumentInfo.InstrumentInfoParams>
          ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
            return await this.fetchInstruments(ctx.params)
          }
        }
      },

      // Service methods
      started(this: InstrumentInfoService) {
        this.logger.info("Service started")
        return initTardis()
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
