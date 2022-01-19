/* eslint-disable max-len */
"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { DbService } from "moleculer-db"
import Sequelize from "sequelize"
import { dbAdapter } from "../datasources/database"

/**
 * VG.MethodologyParams = { exchange: 'deribit', baseCurrency: 'eth', type: 'option', methodology: 'mfiv', timestamp: Date }}
 * VG.MfivParams = MethodologyParams & { interval: '14d', methodology: 'mfiv', nearExpiration: Date, nextExpiration: Date }
 * VG.InstrumentInfoParams = { exchange: 'deribit', baseCurrency: 'eth', contractType: 'call_option' | 'put_option', expiry: isoDateString, availableSince: isoDateString, availableTo: isoDateString }
 * VG.MfivIndexParams = { exchange: 'deribit', currency: 'eth', methodology: 'mfiv', interval: '14d', timestamp: isoDateStr }
 * Tardis.OptionSummary = { type: 'option', expirationDate: isoDateStr, optionType: 'call' | 'put' }
 * VG.MethodologyOptionSummary = VG.OptionSummary & { methodology: 'mfiv', price: number, }
 * VG.MfivOptionSummary = VG.MethodologyOptionSummary & { methodology: 'mfiv', midPrice: number }
 * VG.IndexValue = { timestamp: isoDateString, value: number, methodology: Methodology, type: 'option', baseCurrency: 'eth', exchange: Exchange }
 *
 * |> map({timestamp: Date, expiryType: 'FridayT08:00:00.000Z', interval: '14d', methodology: 'mfiv'} => { nearExpirationDate: Date, nextExpirationDate: Date })
 * |> map({ exchange: 'deribit', baseCurrency: 'eth', type: 'option', methodology: 'mfiv', timestamp: Date, nearExpirationDate: Date, nextExpirationDate: Date })
 * |> map(VG.MethodologyParams => VG.MfivParams) # Friday expiries
 * |> map(VG.MfivParams => Tardis.OptionSummary[])
 * |> map(Tardis.OptionSummary[] => VG.MfivOptionSummary[])
 * |> map(VG.MfivOptionSummary[] => VG.MethodologyOptionSummary[])
 * |> map(VG.MethodologyOptionSummary[], VG.MethodologyOptionSummary[][{ type, expirationDate, optionType }])
 * |> IndexValue = { timestamp: isoDateString, value: number, methodology: 'mfiv', type: 'option', exchange: 'deribit', currency: 'eth', interval: '14d', computedAt: isoDateString }
 *
 */
export default class IndexService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "index",
      mixins: [DbService],
      adapter: dbAdapter,
      model: {
        name: "index",
        define: {
          timestamp: Sequelize.DATE,
          feed: Sequelize.STRING,
          value: Sequelize.DECIMAL,
          data: Sequelize.JSONB
        },
        options: {
          // Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
        }
      },
      // Settings
      settings: {
        $dependencyTimeout: 30000
      },
      // Metadata
      metadata: {
        scalable: true
      },

      // Actions
      actions: {
        estimate: {
          rest: "/estimate",
          params: {
            at: { type: "string" },
            nearExpiration: { type: "string" },
            nextExpiration: { type: "string" }
          },
          async handler(
            this: IndexService,
            ctx: Context<{ at: string; nearExpiration: string; nextExpiration: string }>
          ): Promise<void> {
            // await this.indexOperation(ctx)
            // //this.estimate(ctx.params)
            return Promise.resolve()
          }
        }
      },

      // Service methods
      async started(this: IndexService) {
        this.logger.info("Start ingest service")
        return Promise.resolve()
      }
    })
  }

  // private async indexOperation(ctx: Context<MfivParams>) {
  //   this.syncOptionSummary(ctx.params)
  //   // stream()
  // }

  // private syncOptionSummary(params: MfivParams) {
  //   this.broker.call("ingest.")
  //   const datasource = this.optionSummaryDataSource(params)
  // }

  // private optionSummaryDataSource()

  // private async estimate({ at, nearExpiration, nextExpiration }: MfivParams) {
  //   this.logger.info("Estimate messages.")
  //   await Promise.resolve()
  //   return true
  // }
}

interface MfivParams {
  at: string
  nearExpiration: string
  nextExpiration: string
}
