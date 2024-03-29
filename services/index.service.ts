import { AppDataSource } from "@datasources/datasource"
import { BaseCurrencyEnum, MethodologyEnum, MethodologyExchangeEnum, MethodologyIndex, SymbolTypeEnum } from "@entities"
import { IIndex, IRate } from "@interfaces"
import { mfivDates } from "@lib/expiries"
import { ensure } from "@lib/utils/ensure"
import { waitForDatasourceReady } from "@lib/utils/helpers"
import { optionSummariesLists } from "@service_helpers/ingest_helper"
import { Context, Service, ServiceBroker } from "moleculer"
import { Result } from "neverthrow"
import newrelic from "newrelic"
import { compute, MfivContext, MfivEvidence, MfivParams, MfivResult, MFIV_ASSETS } from "node-volatility-mfiv"
import { OptionSummary } from "tardis-dev"
import { chainFrom } from "transducist"

/* eslint-disable max-len */
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
  private risklessRate?: IRate.RisklessRateResponse

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: ensure("SERVICE_NAME", "index"),

      model: MethodologyIndex,

      mixins: [],

      settings: {
        $dependencyTimeout: 60000,

        skipPersist: process.env.INDEX_SKIP_PERSIST === "true"
      },

      dependencies: ["ingest-eth", "ingest-btc"],

      metadata: {
        scalable: true
      },

      // Actions
      actions: {
        estimate: {
          visibility: "public",
          params: {
            at: { type: "string" },
            exchange: { type: "enum", values: ["deribit"], default: "deribit" },
            methodology: { type: "enum", values: ["MFIV"], default: "MFIV" },
            asset: { type: "enum", values: MFIV_ASSETS },
            timePeriod: { type: "string", pattern: /^\d+[Dd]$/, default: "14D" },
            symbolType: { type: "enum", values: ["option"], default: "option" },
            expiryType: { type: "string", default: "FridayT08:00:00Z" },
            contractType: { type: "array", items: "string", enum: ["call_option", "put_option"] }
          },
          handler(this: IndexService, ctx: Context<IIndex.EstimateParams>): Promise<IIndex.EstimateResponse> {
            // TODO: Make sure timePeriod isn't 0
            // TODO: Make sure timePeriod can't be too large.

            return this.indexOperation(ctx, ctx.params)
              .then(evidence => {
                newrelic.incrementMetric("/Index/estimate")
                this.logger.trace(JSON.stringify(evidence))
                return evidence
              })
              .catch(reason => {
                this.logger.error(JSON.stringify(reason))
                throw reason
              })
          }
        }
      },

      events: {
        "rate.updated": {
          handler(this: IndexService, context: Context<IRate.RisklessRateResponse>) {
            newrelic.incrementMetric("/Index/rate.updated")
            this.risklessRate = context.params
          }
        }
      },

      started(): Promise<void> {
        newrelic.addCustomAttribute("Service", this.name)
        return waitForDatasourceReady()
      }
    })
  }

  private async indexOperation(context: Context<IIndex.EstimateParams>, params: IIndex.EstimateParams) {
    const indexAtDate = new Date(params.at)

    const methodologyDates = mfivDates(new Date(params.at), params.timePeriod, params.expiryType)

    const options = await optionSummariesLists(context, methodologyDates)

    const risklessRate = this.risklessRate ?? {
      risklessRate: 0.366856442493147,
      risklessRateAt: "2022-03-17T17:17:00.702Z",
      risklessRateSource: "AAVE"
    }

    const mfivContext: MfivContext = {
      ...params,
      ...risklessRate
    }

    // The last option price by timestamp becomes the underlying price
    const mostRecent = findMostRecent(options)
    const underlyingPrice = mostRecent?.underlyingPrice ?? 0
    const mfivParams: MfivParams = {
      at: indexAtDate.toISOString(),
      nearDate: methodologyDates.nearExpiration,
      nextDate: methodologyDates.nextExpiration,
      options: options as RequiredOptionSummary[],
      underlyingPrice
    }

    this.logger.info("optionLists", {
      length: options.length,
      asset: params.asset,
      exchange: params.exchange,
      first: options[0].symbol,
      last: options[options.length - 1].symbol
    })
    newrelic.recordMetric("/Index/options#length", options.length)

    const maybeMfivResult = Result.fromThrowable(
      () => compute(mfivContext, mfivParams),
      err => {
        this.logger.error("compute(mfivContext, mfivParams)", { mfivContext, mfivParams: JSON.stringify(mfivParams) })
        newrelic.noticeError(err as Error)
        return new Error("No index")
      }
    )()

    if (maybeMfivResult.isErr()) {
      this.logger.error("err", maybeMfivResult.error)
      return maybeMfivResult.error
    }

    const mfivResult = maybeMfivResult.value

    const evidence: MfivEvidence = {
      version: "2022-05-10",
      type: "MFIV.ESTIMATE.EVIDENCE",
      context: mfivContext,
      params: mfivParams,
      result: mfivResult
    }
    await this.announce(evidence)

    if (!this.settings.skipPersist) {
      await this.persist(evidence, {
        requestId: context.requestID ?? this.broker.generateUid(),
        near: mfivParams.nearDate,
        next: mfivParams.nextDate,
        iVal: mfivResult.invdVol?.toString() || "undefined"
      })
    }

    this.logger.debug("estimate", mfivResult)
    // const { intermediates, ...valObj } = mfivResult
    // this.logger.debug("estimate - intermediates", intermediates)
    // this.logger.info("estimate", { valObj, mfivContext })
    // this.logger.info("estimate.metrics", {
    //   input: { length: mfivParams.options.length, oldest: hud(oldest), newest: hud(mostRecent) },
    //   near: { final: mfivResult.intermediates?.finalNearBook.length },
    //   next: { final: mfivResult.intermediates?.finalNextBook.length }
    // })
    return evidence
  }

  private async persist(
    this: IndexService,
    evidence: {
      version: string
      context: MfivContext
      params: MfivParams
      result: MfivResult
    },
    extra: { requestId: string; iVal: string; near: string; next: string }
  ) {
    const ctx = evidence.context

    const index = AppDataSource.manager.create(MethodologyIndex, {
      symbolType: SymbolTypeEnum.Option,
      timestamp: new Date(evidence.params.at),
      asset: ctx.asset as BaseCurrencyEnum,
      exchange: ctx.exchange as MethodologyExchangeEnum,
      methodology: ctx.methodology as MethodologyEnum,
      timePeriod: ctx.timePeriod,
      value: evidence.result.dVol?.toString() ?? "undefined",
      extra
    })

    await AppDataSource.manager
      .save([index])
      .then(models => newrelic.incrementMetric("/MethodologyIndex/save", 1))
      .catch(err => this.logger.error("Database save error", err))
    // const index: MethodologyIndex = this.adapter.repository.create() // ctx as DeepPartial<MethodologyIndex>

    /**
     * This persists Mfiv values to the DB but should be refactored
     *
     * @deprecated
     * */
    //    index.timestamp = new Date(evidence.params.at)
    // index.value = evidence.result.dVol?.toString() ?? "undefined"
    // index.asset = ctx.asset as BaseCurrencyEnum
    // index.exchange = ctx.exchange as MethodologyExchangeEnum
    // index.methodology = ctx.methodology as MethodologyEnum
    // index.timePeriod = ctx.timePeriod as MethodologyWindowEnum
    // index.symbolType = SymbolTypeEnum.Option
    // index.extra = extra
    // await this.adapter.repository.save(index)
  }

  private async announce(evidence: { version: string; context: MfivContext; params: MfivParams; result: MfivResult }) {
    this.logger.debug("compute(mfiv)", JSON.stringify(evidence))
    const ctx = evidence.context
    const event = `${ctx.methodology}.${ctx.timePeriod}.${ctx.asset}.index.created`
    await this.broker.broadcast(event, evidence, ["ws"])
  }
}

type RequiredOptionSummary = {
  expirationDate: Date
  strikePrice: number
  underlyingPrice: number
  bestBidPrice: number
  bestAskPrice: number
  markPrice: number
  timestamp: Date
  symbol: string
  optionType: "put" | "call"
}
// type RequiredOptionSummary = Required<
//   Pick<
//     OptionSummary,
//     | "expirationDate"
//     | "strikePrice"
//     | "underlyingPrice"
//     | "bestBidPrice"
//     | "bestAskPrice"
//     | "markPrice"
//     | "timestamp"
//     | "symbol"
//     | "optionType"
//   >
// >

function cmpMostRecent(a: OptionSummary, b: OptionSummary): number {
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

function cmpOldest(a: OptionSummary, b: OptionSummary): number {
  return a.timestamp < b.timestamp
    ? 1
    : a.timestamp > b.timestamp
    ? -1
    : a.localTimestamp < b.localTimestamp
    ? 1
    : a.localTimestamp > b.localTimestamp
    ? -1
    : 0
}

// TOOO: Expire values that haven't changed in a long time.
//       If we always return the last value of something then we will
//       emit repetitive values rather than 'undefined'
// const findLastUnderlyingPrice = (options: OptionSummary[]) => chainFrom(options).max(cmpFuncOrd)?.underlyingPrice
const findMostRecent = (options: OptionSummary[]) => chainFrom(options).max(cmpMostRecent)
// const findOldest = (options: OptionSummary[]) => chainFrom(options).max(cmpOldest)
// const hud = (o: OptionSummary | null) =>
//  o ? [o.timestamp, o.bestBidPrice, o.symbol, o.bestAskPrice, o.localTimestamp] : []
