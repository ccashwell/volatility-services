"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { Exchange, InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"
import { initTardis } from "../datasources/tardis"
import { tardisOptionInstrumentDataSource } from "../datasources/tardis_instrument_datasource"

interface InstrumentInfoParams {
  exchange: Exchange
  baseCurrency: string
  interval: "14d"
  methodology: "mfiv"
  type: "option"
  expiryType: "FridayT08:00:00"
  timestamp: string
}

export default class InstrumentService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "instruments",
      // Version
      version: 1,

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
            // exchange: { type: "string", enum: ["deribit"] },
            // baseCurrency: { type: "string", enum: ["ETH"] },
            // interval: { type: "string", enum: ["14d"] },
            // methodology: { type: "string", enum: ["mfiv"] },
            timestamp: { type: "string" }
            //            contractType: { type: "string", enum: ["option"] }
          },
          rest: "/instruments",
          // Enable caching to this action
          cache: true,
          async handler(this: InstrumentService, ctx: Context<InstrumentInfoParams>): Promise<string[]> {
            return await this.fetchInstruments(ctx.params)
          }
        }
      },

      // Service methods
      async started(this: InstrumentService) {
        this.logger.info("Service started")
        return await initTardis()
      }
    })
  }

  public async fetchInstruments(this: InstrumentService, params: InstrumentInfoParams): Promise<string[]> {
    this.logger.info("fetchInstruments()", params)

    const Available = (item: InstrumentInfo) =>
      item.availableSince <= params.timestamp && item.availableTo ? item.availableTo > params.timestamp : true

    return chainFrom(await this.fetchActiveInstruments(params))
      .filter(Available)
      .map(item => item.id)
      .toArray()
  }

  private async fetchActiveInstruments({ exchange, baseCurrency }: InstrumentInfoParams) {
    return await tardisOptionInstrumentDataSource({ exchange, baseCurrency, active: true })
  }
}
