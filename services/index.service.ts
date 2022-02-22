/* eslint-disable max-len */
"use strict"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyIndex,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities"
import { IIndex } from "@interfaces"
import { mfivDates } from "@lib/expiries"
import { optionSummariesLists } from "@service_helpers/ingest_helper"
import { Context, Service, ServiceBroker } from "moleculer"
import * as DbService from "moleculer-db"
import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
import { Result } from "neverthrow"
import { compute, MfivContext, MfivEvidence, MfivParams, MfivResult } from "node-volatility-mfiv"
import { OptionSummary } from "tardis-dev"
import { chainFrom } from "transducist"
import { getConnection, getRepository, Repository } from "typeorm"
import configuration from "../src/configuration"

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

      adapter: new TypeOrmDbAdapter<MethodologyIndex>(configuration.adapter),

      model: MethodologyIndex,

      mixins: [DbService],

      settings: {
        $dependencyTimeout: 60000,

        fields: ["timestamp", "value", "methodology", "interval", "baseCurrency", "exchange", "symbolType", "extra"],

        idField: "timestamp"
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
          params: {
            at: { type: "string" },
            exchange: { type: "enum", values: ["deribit"], default: "deribit" },
            methodology: { type: "enum", values: ["mfiv"], default: "mfiv" },
            baseCurrency: { type: "enum", values: ["ETH"], default: "ETH" },
            interval: { type: "enum", values: ["14d"], default: "14d" },
            symbolType: { type: "enum", values: ["option"], default: "option" },
            expiryType: { type: "string", default: "FridayT08:00:00Z" },
            contractType: { type: "array", items: "string", enum: ["call_option", "put_option"] }
          },
          handler(this: IndexService, ctx: Context<IIndex.EstimateParams>): Promise<IIndex.EstimateResponse> {
            return this.indexOperation(ctx, ctx.params)
              .then(evidence => {
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

      async stopped() {
        return await getConnection().close()
      }
    })
  }

  private get repository(): Repository<MethodologyIndex> {
    return getRepository(MethodologyIndex)
  }

  private async indexOperation(context: Context<IIndex.EstimateParams>, params: IIndex.EstimateParams) {
    const indexAtDate = new Date(params.at)

    const methodologyDates = mfivDates(new Date(params.at), params.interval, params.expiryType)

    const options = await optionSummariesLists(context, methodologyDates)

    const mfivContext: MfivContext = {
      ...params,
      windowInterval: params.interval,
      currency: params.baseCurrency,
      ...configuration.indexSettings
    }

    // The last option price by timestamp becomes the underlying price
    const mostRecent = findMostRecent(options)
    const underlyingPrice = mostRecent?.underlyingPrice ?? 0
    const mfivParams: MfivParams = {
      at: indexAtDate.toISOString(),
      nearDate: methodologyDates.nearExpiration,
      nextDate: methodologyDates.nextExpiration,
      options: options as {
        expirationDate: Date
        strikePrice: number
        underlyingPrice: number
        bestBidPrice: number
        bestAskPrice: number
        markPrice: number
        timestamp: Date
        symbol: string
        optionType: "put" | "call"
      }[],
      underlyingPrice
    }

    const maybeMfivResult = Result.fromThrowable(
      () => compute(mfivContext, mfivParams),
      err => {
        console.error("compute failed", err)
        return new Error("No index")
      }
    )()

    if (maybeMfivResult.isErr()) {
      return maybeMfivResult.error
    }

    const mfivResult = maybeMfivResult.value

    const evidence: MfivEvidence = {
      version: "2022-01-01",
      type: "mfiv.estimate.evidence",
      context: mfivContext,
      params: mfivParams,
      result: mfivResult
    }
    await this.announce(evidence)
    await this.persist(evidence, {
      requestId: context.requestID ?? this.broker.generateUid(),
      near: mfivParams.nearDate,
      next: mfivParams.nextDate,
      iVal: mfivResult.invdVol?.toString() || "undefined"
    })
    const { intermediates, ...valObj } = mfivResult
    this.logger.debug("estimate - intermediates", intermediates)
    this.logger.info("estimate", { valObj, mfivContext })
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
    //const index = this.adapter.getRepository<MethodologyIndex>(MethodologyIndex)
    // const index = repository.create()
    // const repository = getConnection().getRepository(MethodologyIndex)

    const index: MethodologyIndex = this.repository.create() // ctx as DeepPartial<MethodologyIndex>
    index.timestamp = new Date(evidence.params.at)
    index.value = evidence.result.dVol?.toString() ?? "undefined"
    index.baseCurrency = ctx.currency as BaseCurrencyEnum
    index.exchange = ctx.exchange as MethodologyExchangeEnum
    index.methodology = ctx.methodology as MethodologyEnum
    index.interval = ctx.windowInterval as MethodologyWindowEnum
    index.symbolType = SymbolTypeEnum.Option
    index.extra = extra
    await this.repository.save(index)
  }

  private async announce(evidence: { version: string; context: MfivContext; params: MfivParams; result: MfivResult }) {
    this.logger.debug("compute(mfiv)", JSON.stringify(evidence))
    const ctx = evidence.context
    const event = `${ctx.methodology}.${ctx.windowInterval}.${ctx.currency}.index.created`
    await this.broker.emit(event, evidence)
  }
}

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
