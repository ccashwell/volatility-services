/* eslint-disable max-len */
"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
// import { DbService } from "moleculer-db"
// import Sequelize from "sequelize"
import { OptionSummary } from "tardis-dev"
import { compute, MfivContext, MfivParams as MethodologyMfivParams, MfivResult } from "node-volatility-mfiv"
import { chainFrom } from "transducist"
// import { dbAdapter } from "../datasources/database"
import { mfivDates } from "../lib/expiries"
// const AuthorModel = db.import('project', require('./path/to/models/project'));

// at: { type: "string" },
// exchange: { type: "string", default: "deribit" },
// methodology: { type: "string", default: "mfiv" },
// currency: { type: "string", default: "ETH" },
// interval: { type: "string", default: "14d" },
// expiryType: { type: "string", default: "FridayT08:00:00" }
// call "index.estimate" --at "2022-01-22T05:33:00.000Z"
/**
 * VG.MethodologyParams = { exchange: 'deribit', baseCurrency: 'eth', type: 'option', methodology: 'mfiv', timestamp: Date }}
 * VG.MfivParams = MethodologyParams & { interval: '14d', methodology: 'mfiv', nearExpiration: Date, nextExpiration: Date }
 * VG.InstrumentInfoParams = { exchange: 'deribit', baseCurrency: 'eth', contractType: 'call_option' | 'put_option', expiry: isoDateString, availableSince: isoDateString, availableTo: isoDateString }
 * VG.MfivIndexParams = { exchange: 'deribit', currency: 'eth', methodology: 'mfiv', interval: '14d', timestamp: isoDateStr }
 * Tardis.OptionSummary = { type: 'option', expirationDate: isoDateStr, optionType: 'call_option' | 'put_option' }
 * VG.MethodologyOptionSummary = VG.OptionSummary & { methodology: 'mfiv', price: number }
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
      // mixins: [DbService],
      // adapter: dbAdapter,
      // model: {
      //   name: "methodology_indices",
      //   define: {
      //     timestamp: Sequelize.DATE,
      //     value: Sequelize.DECIMAL,
      //     symbolType: Sequelize.ENUM(""),
      //     methodology: Sequelize.ENUM("mfiv"),
      //     baseCurrency: Sequelize.ENUM(""),
      //     interval: Sequelize.ENUM(""),
      //     extra: Sequelize.JSONB,
      //     createdAt: Sequelize.DATE
      //   },
      //   options: {
      //     // Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
      //   }
      // },
      settings: {
        $dependencyTimeout: 30000
      },
      dependencies: [
        {
          name: "ingest"
        }
      ],
      metadata: {
        scalable: true
      },

      // Actions
      actions: {
        estimate: {
          rest: "/estimate",
          params: {
            at: { type: "string" },
            exchange: { type: "string", default: "deribit" },
            methodology: { type: "string", default: "mfiv" },
            currency: { type: "string", default: "ETH" },
            interval: { type: "string", default: "14d" },
            expiryType: { type: "string", default: "FridayT08:00:00" }
          },
          async handler(this: IndexService, ctx: Context<IndexParams>): Promise<void> {
            return await this.indexOperation(ctx.params)
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

  private async indexOperation(params: IndexParams) {
    const indexAtDate = new Date(params.at)
    const methodologyDates = mfivDates(indexAtDate, params.interval, params.expiryType)
    const nearOptions: Promise<OptionSummary[]> = this.broker.call("ingest.summaries", {
      expiry: methodologyDates.nearExpiration
    })
    const nextOptions: Promise<OptionSummary[]> = this.broker.call("ingest.summaries", {
      expiry: methodologyDates.nextExpiration
    })
    const [nearExpiries, nextExpiries] = await Promise.all([nearOptions, nextOptions])
    const mfivContext: MfivContext = {
      windowInterval: params.interval as "14d",
      risklessRate: 0.0055,
      risklessRateAt: indexAtDate.toISOString(),
      risklessRateSource: "aave",
      methodology: params.methodology,
      exchange: params.exchange as "deribit",
      currency: params.currency
    }
    const options = nearExpiries.concat(nextExpiries)
    const underlyingPrice = findLastUnderlyingPrice(options) ?? 0
    const mfivParams: MethodologyMfivParams = {
      at: indexAtDate.toISOString(),
      nearDate: methodologyDates.nearExpiration,
      nextDate: methodologyDates.nextExpiration,
      options: options as {
        expirationDate: Date
        strikePrice: number
        underlyingPrice: number
        bestBidPrice: number | undefined
        bestAskPrice: number | undefined
        markPrice: number
        timestamp: Date
        symbol: string
        optionType: "put" | "call"
      }[],
      underlyingPrice
    }

    // TODO: use Result.fromThrowable
    const mfivResult = compute(mfivContext, mfivParams)
    const evidence = { version: "2022-01-01", context: mfivContext, params: mfivParams, result: mfivResult }
    await this.announce(evidence)
  }

  private async announce(evidence: {
    version: string
    context: MfivContext
    params: MethodologyMfivParams
    result: MfivResult
  }) {
    this.logger.debug("compute(mfiv)", JSON.stringify(evidence))
    const ctx = evidence.context
    const event = `${ctx.exchange}.${ctx.methodology}.${ctx.currency}.${ctx.windowInterval}.estimate`
    await this.broker.emit(event, evidence)
  }
}

// function cmpFunc(a: OptionSummary, b: OptionSummary): OptionSummary {
//   return a.timestamp > b.timestamp
//     ? a
//     : a.timestamp < b.timestamp
//     ? b
//     : a.localTimestamp > b.localTimestamp
//     ? a
//     : a.localTimestamp < b.localTimestamp
//     ? b
//     : a
// }

function cmpFuncOrd(a: OptionSummary, b: OptionSummary): number {
  return a.timestamp > b.timestamp
    ? 1
    : a.timestamp < b.timestamp
    ? -1
    : a.localTimestamp > b.localTimestamp
    ? 1
    : a.localTimestamp < b.localTimestamp
    ? -1
    : 0
}

// TOOO: Expire values that haven't changed in a long time.
//       If we always return the last value of something then we will
//       emit repetitive values rather than 'undefined'
const findLastUnderlyingPrice = (options: OptionSummary[]) => chainFrom(options).max(cmpFuncOrd)?.underlyingPrice
interface IndexParams {
  at: string
  exchange: string
  methodology: "mfiv"
  currency: "ETH"
  interval: string
  expiryType: string
}
