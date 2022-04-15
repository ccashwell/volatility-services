/* eslint-disable max-len */
import { provideRateResponse } from "@datasources/aave"
import { AppDataSource } from "@datasources/datasource"
import { Rate } from "@entities"
import { IRate } from "@interfaces/services/rate"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import { waitForDatasourceReady } from "@lib/utils/helpers"
import { Mappers } from "@lib/utils/mappers"
import { Context, Errors, Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import { ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import { DeepPartial } from "typeorm"
export default class RateService extends Service {
  lastRate?: Rate

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "rate",

      crons: [
        {
          name: "FetchAaveRateCron",
          cronTime: process.env.RATE_RISKLESS_RATE_CRONTIME || "0 */1 * * * *",
          onTick: async () => {
            const maybeRate: IRate.RisklessRateResponse | Errors.MoleculerError = await this.actions.risklessRate({
              source: this.settings.risklessRateSource as string
            })

            if (maybeRate instanceof Errors.MoleculerError) {
              this.logger.error("error requesting interest rate from aave", maybeRate)
            } else {
              this.logger.info("aave rate", maybeRate)
              await this.broker.broadcast("rate.updated", maybeRate, ["index", "index-eth", "index-btc"])
            }
          },
          timeZone: "UTC"
        }
      ],

      settings: {
        $dependencyTimeout: 30000,

        skipPersist: process.env.RATE_SKIP_PERSIST === "true",

        risklessRateSource: process.env.RATE_RISKLESS_RATE_SOURCE ?? "AAVE"
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      mixins: [Cron],

      actions: {
        /**
         * Get the liquidity rate from AAVE via the LendingPools contract
         */
        risklessRate: {
          visibility: "public",
          params: {
            source: { type: "enum", values: ["AAVE"], default: "AAVE" }
          },
          async handler(
            this: RateService,
            ctx: Context<IRate.RisklessRateParams>
          ): Promise<IRate.RisklessRateResponse | Errors.MoleculerError> {
            const result = await this.fetchRate(ctx.params)

            if (result.isOk()) {
              return result.value
            } else {
              throw result.error
            }
          }
        }
      },

      started(this: RateService): Promise<void> {
        newrelic.addCustomAttribute("Service", this.name)
        return waitForDatasourceReady()
        // const params: IRate.RisklessRateParams = { risklessRateSource: this.settings.risklessRateSource }
        // const result = await this.fetchRate(params)
        // if (result.isOk()) {
        //   return Promise.resolve()
        // } else {
        //   return Promise.reject(result.error)
        // }
      }
    })
  }

  async fetchRate(params: IRate.RisklessRateParams) {
    return await ResultAsync.fromPromise(this.fetchRisklessRate(params), handleAsMoleculerError).map(async response => {
      if (!this.settings.skipPersist) {
        this.logger.info("Comparing", { sourceValue: this.lastRate?.value, risklessRate: response.risklessRate })
        if (this.lastRate?.value !== response.risklessRate.toString()) {
          this.lastRate = await this.persist(response)
        }
      }
      return response
    })
  }

  async fetchRisklessRate(params: IRate.RisklessRateParams) {
    // TODO: This should be a look-up to a provider
    // const provideRateResponse = providers.find(params.risklessRateSource)
    return await provideRateResponse()
  }

  private persist(response: IRate.RisklessRateResponse & { contractValue: number }) {
    const entity = AppDataSource.manager.create(Rate, Mappers.Rate.from(response) as DeepPartial<Rate>)
    return AppDataSource.manager.save(entity)
  }
}
