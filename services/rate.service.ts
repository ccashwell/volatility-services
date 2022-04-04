/* eslint-disable max-len */
import { provideRateResponse } from "@datasources/aave"
import { Rate } from "@entities"
import { IRate } from "@interfaces/services/rate"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import { Mappers } from "@lib/utils/mappers"
import { Context, Errors, Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import * as DbService from "moleculer-db"
import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
import { ResultAsync } from "neverthrow"
import { DeepPartial } from "typeorm"
import OrmConfig from "../ormconfig"

export default class RateService extends Service {
  adapter!: TypeOrmDbAdapter<Rate>

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "rate",

      crons: [
        {
          name: "FetchAaveRateCron",
          cronTime: process.env.RATE_RISKLESS_RATE_CRONTIME || "0 */1 0 * * *",
          onTick: async () => {
            const maybeRate: IRate.RisklessRateResponse | Errors.MoleculerError = await this.actions.risklessRate({
              source: this.settings.risklessRateSource as string
            })

            if (maybeRate instanceof Errors.MoleculerError) {
              this.logger.error("error requesting interest rate from aave", maybeRate)
            } else {
              this.logger.info("aave rate", maybeRate)
              await this.broker.broadcast("rate.updated", maybeRate, ["index"])
            }
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
      adapter: new TypeOrmDbAdapter<Rate>(OrmConfig),

      model: Rate,

      mixins: [
        Cron,
        DbService,
        {
          actions: {
            get: { visibility: "private" },
            list: { visibility: "private" },
            find: { visibility: "private" },
            count: { visibility: "private" },
            create: { visibility: "private" },
            insert: { visibility: "private" },
            update: { visibility: "private" },
            remove: { visibility: "private" }
          }
        }
      ],
      // mixins: [DbService],

      actions: {
        /**
         * Get the liquidity rate from AAVE via the LendingPools contract
         */
        risklessRate: {
          visibility: "private",
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

  async fetchRisklessRate(params: IRate.RisklessRateParams) {
    // TODO: This should be a look-up to a provider
    // const provideRateResponse = providers.find(params.risklessRateSource)
    return await provideRateResponse()
  }

  private persist(response: IRate.RisklessRateResponse & { contractValue: number }) {
    const entity = this.adapter.repository.create(Mappers.Rate.from(response) as DeepPartial<Rate>)
    return this.adapter.repository.save(entity)
  }
}
