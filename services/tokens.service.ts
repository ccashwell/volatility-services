import { AppDataSource } from "@datasources/datasource"
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { AuthToken } from "@entities/auth_token"
import C from "@lib/constants"
import crypto from "crypto"
import { Context, Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"

const TESTING = process.env.NODE_ENV === "test"

export default class TokenService extends Service {
  // @ts-ignore
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: "tokens",

      mixins: [Cron],

      settings: {
        $dependencyTimeout: 60000,

        skipPersist: process.env.TOKENS_SKIP_PERSIST === "true"
      },

      dependencies: [],

      metadata: {
        scalable: true
      },

      crons: [
        {
          name: "ClearExpiredTokens",
          cronTime: "0 0 0 * * *",
          onTick: {
            action: "tokens.clearExpired"
          },
          timeZone: "UTC"
        }
      ],

      /**
       * Actions
       */
      actions: {
        /**
         * Generate a new token.
         */
        generate: {
          visibility: "public",
          params: {
            type: {
              type: "enum",
              values: C.TOKEN_TYPES,
              default: C.TOKEN_TYPE_API_KEY
            },
            expireInNumDays: {
              type: "number",
              integer: true,
              positive: true,
              optional: true
            },
            expiry: {
              // Number of days from now that
              type: "date",
              integer: true,
              positive: true,
              optional: true
            },
            owner: { type: "string", default: "volatility" }
          },
          async handler(
            this: TokenService,
            ctx: Context<Pick<AuthToken, "type" | "expiry" | "owner"> & { expireInNumDays: number }>
          ) {
            let expiryTimestamp

            if (ctx.params.expireInNumDays !== undefined) {
              expiryTimestamp = new Date(Date.now() + ctx.params.expireInNumDays * C.MILLISECONDS_PER_DAY)
            }

            const { token, secureToken } = this.generateToken(C.TOKEN_LENGTH)

            const resource = AppDataSource.manager.create(AuthToken, {
              ...ctx.params,
              expiry: expiryTimestamp,
              token: secureToken
            })
            if (ctx.params.owner === "volatility") {
              this.logger.warn("Generating a volatility owned token", ctx.params)
            }
            const res = await AppDataSource.manager.save(resource)

            //
            // Return pre-hashed token to be viewed one-time by user
            //
            return { ...res, token }
          }
        },
        /**
         * Check a token exist & not expired.
         */
        check: {
          visibility: "public",
          params: {
            type: {
              type: "enum",
              values: C.TOKEN_TYPES
            },
            token: { type: "string" },
            owner: { type: "string", optional: true }
          },
          async handler(
            this: TokenService,
            ctx: Context<Pick<AuthToken, "type" | "token" | "owner"> & { isUsed: boolean }>
          ) {
            this.logger.info("Checking token", ctx.params)
            const entity = await AppDataSource.manager.findOneBy(AuthToken, {
              type: ctx.params.type,
              token: this.secureToken(ctx.params.token)
            })

            this.logger.info("entity found", entity)

            if (entity) {
              this.logger.info("entity found")

              if (!ctx.params.owner || entity.owner === ctx.params.owner) {
                if (entity.expiry && entity.expiry < new Date()) {
                  this.logger.debug("Token expired")
                  return false
                }
                // if (ctx.params.isUsed) {

                this.logger.info("Token last used", entity.lastUsedAt)
                entity.lastUsedAt = new Date()

                await AppDataSource.manager.save(entity)
                // }

                // this.logger.info("entity", entity)
                return true
              }
            }

            return false
          }
        },
        /**
         * Remove an invalidated token
         */
        remove: {
          params: {
            type: {
              type: "enum",
              values: C.TOKEN_TYPES
            },
            token: { type: "string" }
          },
          async handler(this: TokenService, ctx: Context<{ type: string; token: string }>) {
            const entity = await AppDataSource.manager.findOneBy(AuthToken, {
              type: ctx.params.type,
              token: this.secureToken(ctx.params.token)
            })
            if (entity) {
              await AppDataSource.manager.remove([entity])
            }
            return null
          }
        },
        /**
         * Clear expired tokens.
         */
        clearExpired: {
          visibility: "protected",
          async handler(this: TokenService) {
            const now = new Date()
            const nowDate = [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()].join("-")
            const entities = await AppDataSource.manager
              .createQueryBuilder()
              .select()
              .from(AuthToken, "auth_tokens")
              .where("auth_tokens.expiry < ':now_date'::interval", { nowDate })
              .getMany()
            const result = await AppDataSource.manager.remove(AuthToken, entities)
            this.logger.info(`Remove ${result.length} expired token(s).`)
          }
        }
      },

      /**
       * Methods
       */
      methods: {},

      /**
       * Service created lifecycle event handler
       */
      created(this: TokenService) {
        if (!process.env.TOKEN_SALT) {
          if (TESTING || process.env.TEST_E2E) {
            process.env.TOKEN_SALT = crypto.randomBytes(32).toString("hex")
          } else {
            this.logger.fatal("Environment variable 'TOKEN_SALT' must be configured!")
          }
        }
      }
    })
  }

  /**
   * Generate a token
   *
   * @param {Number} len Token length
   * @returns {Object}
   */
  generateToken(this: TokenService, len = 50): { token: string; secureToken: string } {
    const token = crypto.randomBytes(len / 2).toString("hex")
    return { token, secureToken: this.secureToken(token) }
  }

  /**
   * Secure a token with HMAC.
   * @param {String} token
   * @returns {String}
   */
  secureToken(this: TokenService, token: string): string {
    const hmac = crypto.createHmac("sha256", Buffer.from(process.env.TOKEN_SALT as string))
    hmac.update(token)
    return hmac.digest("hex")
  }
}
