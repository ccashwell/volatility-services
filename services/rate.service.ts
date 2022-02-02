/* eslint-disable max-len */
"use strict"
import Moleculer, { Context, Service, ServiceBroker, Errors } from "moleculer"

//#region Local Imports
import connectionInstance from "@entities/connection"
import { IRate } from "@interfaces/services/rate"
import provideRateResponse from "@datasources/aave"
//#endregion Local Imports

export default class RateService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "rate",

      settings: {
        $dependencyTimeout: 30000
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      // Actions
      actions: {
        risklessRate: {
          params: {
            source: { type: "enum", values: ["aave"], default: "aave" }
          },
          handler(
            this: RateService,
            ctx: Context<IRate.RisklessRateParams>
          ): Promise<IRate.RisklessRateResponse | Errors.MoleculerError> {
            return this.fetchRisklessRate(ctx.params)
          }
        }
      },
      // Service methods
      async started(this: RateService) {
        this.logger.info("Start rate service")
        await connectionInstance()
      },

      async stopped() {
        //return await getConnection().close()
        return Promise.resolve()
      }

      // afterConnected(this: IndexService) {
      //   this.logger.info("Connected successfully")
      //   return this.adapter.clear()
      // }
    })
  }

  async fetchRisklessRate(params: IRate.RisklessRateParams) {
    // TODO: This should be a look-up to a provider
    // const provideRateResponse = providers.find(params.risklessRateSource)
    return await provideRateResponse()
  }
}
