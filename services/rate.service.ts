/* eslint-disable max-len */
"use strict"
import { provideRateResponse } from "@datasources/aave"
import { Rate } from "@entities"
import { IRate } from "@interfaces/services/rate"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import { Mappers } from "@lib/utils/mappers"
import { Context, Errors, Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import { ResultAsync } from "neverthrow"
import { DeepPartial, getRepository, Repository } from "typeorm"

export default class RateService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "rate",

      crons: [
        {
          name: "FetchAaveRateCron",
          cronTime: process.env.RATE_RISKLESS_RATE_CRONTIME,
          onTick: async () => {
            const result = await this.actions.risklessRate({ source: this.settings.risklessRateSource })
            this.logger.info("aave rate", result)
            await this.broker.broadcast("rate.updated", result, ["index"])
          },
          timeZone: "UTC"
        }
      ],

      settings: {
        $dependencyTimeout: 30000,

        fields: ["id", "value", "sourceValue", "source", "rateAt"],

        idField: ["id"],

        skipPersist: process.env.RATE_SKIP_PERSIST === "true",

        risklessRateSource: process.env.RATE_RISKLESS_RATE_SOURCE ?? "AAVE"
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      // adapter: new TypeOrmDbAdapter<Rate>(configuration.adapter),

      // model: Rate,

      mixins: [Cron],
      // mixins: [DbService],

      actions: {
        /**
         * Get the liquidity rate from AAVE via the LendingPools contract
         */
        risklessRate: {
          params: {
            source: { type: "enum", values: ["AAVE"], default: "AAVE" }
          },
          async handler(
            this: RateService,
            ctx: Context<IRate.RisklessRateParams>
          ): Promise<IRate.RisklessRateResponse | Errors.MoleculerError> {
            const result = await ResultAsync.fromPromise(
              this.fetchRisklessRate(ctx.params),
              handleAsMoleculerError
            ).map(async response => {
              if (!this.settings.skipPersist) {
                await this.persist(response)
              }
              return response
            })

            if (result.isOk()) {
              return result.value
            } else {
              throw result.error
            }
          }
        }
      },

      async stopped() {
        // if (!this.settings.skipPersist) {
        //   return await getConnection().close()
        // }
      }
    })
  }

  private get repository(): Repository<Rate> {
    return getRepository(Rate)
    //return (this.adapter as TypeOrmDbAdapter<Rate>).repository
  }

  async fetchRisklessRate(params: IRate.RisklessRateParams) {
    // TODO: This should be a look-up to a provider
    // const provideRateResponse = providers.find(params.risklessRateSource)
    return await provideRateResponse()
  }

  private persist(response: IRate.RisklessRateResponse & { contractValue: number }) {
    const entity = this.repository.create(Mappers.Rate.from(response) as DeepPartial<Rate>)
    return this.repository.save(entity)
  }
}
