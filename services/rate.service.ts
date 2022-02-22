/* eslint-disable max-len */
"use strict"
import { provideRateResponse } from "@datasources/aave"
import { Rate } from "@entities"
import { IRate } from "@interfaces/services/rate"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import { Mappers } from "@lib/utils/mappers"
import { Context, Errors, Service, ServiceBroker } from "moleculer"
import * as DbAdapter from "moleculer-db"
import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
import { ResultAsync } from "neverthrow"
import { DeepPartial, getConnection, getRepository, Repository } from "typeorm"
import configuration from "../src/configuration"

export default class RateService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "rate",

      settings: {
        $dependencyTimeout: 30000,

        fields: ["id", "value", "sourceValue", "source", "rateAt"],

        idField: ["id"]
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      adapter: new TypeOrmDbAdapter<Rate>(configuration.adapter),

      model: Rate,

      mixins: [DbAdapter],

      actions: {
        /**
         * Get the liquidity rate from AAVE via the LendingPools contract
         */
        risklessRate: {
          params: {
            source: { type: "enum", values: ["aave"], default: "aave" }
          },
          async handler(
            this: RateService,
            ctx: Context<IRate.RisklessRateParams>
          ): Promise<IRate.RisklessRateResponse | Errors.MoleculerError> {
            const result = await ResultAsync.fromPromise(
              this.fetchRisklessRate(ctx.params),
              handleAsMoleculerError
            ).map(async response => {
              await this.persist(response)
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
        return await getConnection().close()
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
