/* eslint-disable camelcase */
import { AppDataSource } from "@datasources/datasource"
import { MfivIndex } from "@entities/mfiv_index"
import { ensure } from "@lib/utils/ensure"
import { VixCalculatorV2 as VixCalculator } from "@lib/vix_calculator_v2"
import dayjs from "dayjs"
import { Context, Service, ServiceBroker } from "moleculer"
import { Asset, MFIV_ASSETS } from "node-volatility-mfiv"
import { EXCHANGES, OptionSummary } from "tardis-dev"
import { InsertResult } from "typeorm"
import { initTardis } from "./../src/datasources/tardis"
import { BaseCurrencyEnum, MethodologyExchangeEnum } from "./../src/entities/types"

const Errors = require("moleculer-web-uws").Errors

/**
 * Compute index values from data produced by the ingest service
 */
export default class BackfillService extends Service {
  private latestMessage?: OptionSummary

  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: "backfill",

      settings: {
        apiKey: ensure("TARDIS_API_KEY"),
        skipDb: false
      },

      actions: {
        mfiv: {
          rest: {
            path: "POST /mfiv"
          },
          visibility: "published",
          params: {
            exchange: { type: "string", default: "deribit", enum: EXCHANGES },
            timePeriod: { type: "string" },
            asset: { type: "string", enum: MFIV_ASSETS },
            replayFrom: { type: "date", convert: true, default: new Date("2022-01-01T00:00:00.000Z") },
            replayTo: { type: "date", convert: true, default: () => new Date() }
          },
          async handler(this: BackfillService, ctx: Context<IBackfillMfivParams>) {
            const { exchange, replayFrom, replayTo, timePeriod, asset } = ctx.params
            const reportFrequency = 5 // Every <N> minutes

            void new VixCalculator({
              apiKey: this.settings.apiKey,
              exchange,
              replayFrom: replayFrom.toISOString(),
              replayTo: replayTo.toISOString(),
              reportFrequency,
              asset: asset as Asset,
              timePeriod,
              onCompute: index => {
                this.logger.debug("onCompute()", index)

                if (this.settings.skipDb) {
                  executeMfivInsert({
                    timestamp: dayjs.utc(index.timestamp as string).toDate(),
                    dVol: index.dVol.toString(),
                    invdVol: index.invdVol.toString(),
                    timePeriod: index.timePeriod,
                    exchange: MethodologyExchangeEnum.Deribit,
                    asset: index.asset as BaseCurrencyEnum,
                    underlyingPrice: index.underlyingPrice.toString(),
                    nearExpiry: dayjs.utc(index.nearExpiry).toDate(),
                    nextExpiry: dayjs.utc(index.nextExpiry).toDate(),
                    extra: {
                      type: "idx",
                      rate: {
                        src: index.risklessRateSource,
                        val: index.risklessRate,
                        ts: dayjs.utc(index.risklessRateAt).toDate()
                      }
                    },
                    createdAt: dayjs.utc().toDate()
                  }).catch((err: Error) => this.logger.error("executeMfivInsert error", err))
                }
              },
              onComplete: () => {
                this.logger.info("onComplete()")
              },
              onError: (err: unknown) => {
                this.logger.error("onError()", err as Error)
              },
              logger: this.logger
            })
              .fetchIndex()
              .catch((err: unknown) => {
                this.logger.error("fetchIndex error", err)
                // TODO: When err is HTTPError: Response code 503 (Service Temporarily Unavailable) we should retry
              })

            return Promise.resolve({ status: "processing", reqId: ctx.requestID, nodeId: ctx.nodeID })
          }
        }
      },

      started(this: BackfillService): Promise<void> {
        this.logger.info("this.skipDb =", this.settings.skipDb)
        return new Promise(resolve => {
          initTardis()
          resolve()
        })
      }
    })
  }

  private getInterestRate() {
    return {
      risklessRate: 0.0056,
      risklessRateAt: "2022-03-17T17:17:00.702Z",
      risklessRateSource: "AAVE"
    }
  }
}

async function executeMfivInsert(mfivIndex: MfivIndex): Promise<InsertResult> {
  return await AppDataSource.manager.createQueryBuilder().insert().into(MfivIndex).values([mfivIndex]).execute()
}

interface IBackfillMfivParams {
  exchange: "deribit"
  timePeriod: string
  asset: string
  replayFrom: Date
  replayTo: Date
}
