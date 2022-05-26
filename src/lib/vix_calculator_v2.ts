import { timePeriodToInteger } from "@lib/utils/time_period"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import utc from "dayjs/plugin/utc"
import Moleculer from "moleculer"
import {
  Asset,
  compute,
  MfivContext,
  MfivParams,
  MfivResult,
  OptionSummary as MfivOptionSummary
} from "node-volatility-mfiv"
import { Exchange, normalizeOptionsSummary, OptionSummary, replayNormalized, streamNormalized } from "tardis-dev"
import { chainFrom } from "transducist"
import { MethodologyEnum } from "./../entities/types"
import { buildExpiries, Expiries } from "./utils/expiries"

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(isSameOrAfter)

const DERIBIT_DATE_FORMAT = "DMMMYY"

export type VixConfig = {
  apiKey: string
  exchange: Exchange
  replayFrom: string
  replayTo: string
  // maxDuration?: number
  // referenceDate?: dayjs.Dayjs | string
  timePeriod: string
  reportFrequency?: number
  asset: Asset
  onCompute?: (index: Index) => void
  onComplete?: () => void
  onError?: (err: unknown) => void
  logger?: Moleculer.LoggerInstance
}

// export type Index = {
//   time: dayjs.Dayjs | string
//   value: number
// }

export type Index = {
  value: number
  dVol: number
  invdVol: number
  methodology: MethodologyEnum
  asset: Asset
  timestamp: dayjs.Dayjs | string
  underlyingPrice: number
  timePeriod: string
  nearExpiry: string
  nextExpiry: string
} & ReturnType<typeof getInterestRate>

export type VixResult = {
  at: dayjs.Dayjs | string
  index: number
  log?: Index[]
}

export class VixCalculatorV2 {
  apiKey: string
  refDate: dayjs.Dayjs
  startDate: dayjs.Dayjs
  risklessRate: number
  timePeriod: number
  timePeriodOption: string
  reportFrequency: number
  maxDuration: number
  exchange: Exchange
  asset: Asset
  expiries!: Expiries
  index: Index | undefined
  logger?: Moleculer.LoggerInstance

  log: Map<string, number> = new Map<string, number>()
  midBook: Map<string, OptionSummary> = new Map<string, OptionSummary>()

  onCompute: (index: Index) => void
  onComplete: () => void
  onError: (err: unknown) => void

  constructor(config: VixConfig) {
    this.apiKey = config.apiKey
    this.exchange = config.exchange
    this.refDate = dayjs.utc(config.replayFrom).startOf("minute")
    this.startDate = dayjs.utc(config.replayFrom).startOf("minute")
    this.risklessRate = getInterestRate().risklessRate
    this.timePeriod = timePeriodToInteger(config.timePeriod)
    this.timePeriodOption = config.timePeriod
    this.maxDuration = dayjs
      .utc(config.replayTo)
      .diff(this.refDate) /* config.maxDuration ?? dayjs.duration(10, "seconds").asMilliseconds() */
    this.asset = config.asset
    this.onCompute = config.onCompute ?? (() => false)
    this.onComplete = config.onComplete ?? (() => false)
    this.onError = config.onError ?? ((err: unknown) => false)
    // this.reportFrequency = config.reportFrequency ?? dayjs.duration(5, "seconds").asMilliseconds()
    this.reportFrequency = dayjs.duration(config.reportFrequency || 15, "minutes").asMilliseconds()
    this.logger = config.logger
  }

  async fetchIndex(): Promise<VixResult> {
    this.expiries = await buildExpiries({
      now: this.refDate.toISOString(),
      timePeriod: this.timePeriod,
      exchange: "deribit",
      asset: this.asset
    })
    await this.summaryStream()

    const avgIndex = Array.from(this.log.values()).reduce((out, index) => (out += index), 0) / this.log.size

    return {
      at: this.refDate.toISOString(),
      index: avgIndex
      // log: Array.from(this.log).map(([time, value]) => ({ time, value }))
    }
  }

  private createStream(): AsyncIterableIterator<OptionSummary> {
    const maxRef = dayjs.utc(this.refDate).add(this.maxDuration, "ms")

    console.log("Starting new stream", {
      initialRef: this.startDate.toISOString(),
      currentRef: this.refDate.toISOString(),
      maxRef: maxRef.toISOString(),
      near: this.expiries.nearExpiry,
      next: this.expiries.nextExpiry
    })

    const sortFn = (a: string, b: string) => {
      return b === a ? 0 : b < a ? 1 : -1
    }

    const symbols = [...this.expiries.nearSymbols.sort(sortFn), ...this.expiries.nextSymbols.sort(sortFn)]

    if (this.refDate.isBefore(dayjs.utc().startOf("minute"))) {
      return replayNormalized(
        {
          apiKey: process.env.TARDIS_API_KEY!,
          exchange: "deribit",
          symbols,
          from: dayjs.utc(this.refDate).toISOString(),
          to: maxRef.isAfter(this.expiries.rolloverAt) ? this.expiries.rolloverAt : maxRef.toISOString(),
          waitWhenDataNotYetAvailable: true,
          autoCleanup: true
        },
        normalizeOptionsSummary
      )
    } else {
      return streamNormalized(
        {
          exchange: "deribit",
          symbols
        },
        normalizeOptionsSummary
      )
    }
  }

  // private async cacheMessage(o: OptionSummary): Promise<void> {
  //   const expiryKey = o.expirationDate.toISOString()
  //   if (!this.expiryMap.has(expiryKey)) {
  //     this.logger.info("Cache Miss", expiryKey)
  //     // TODO: Should probably be ingesting into a Red-Black Tree
  //     this.expiryMap.set(expiryKey, new Set<string>())
  //   }
  //   const expirySet = this.expiryMap.get(expiryKey)
  //   expirySet?.add(o.symbol)
  //   if (this.broker.cacher) {
  //     await this.broker.cacher.set(
  //       o.symbol,
  //       summaryWithDefaults(o, { bestAskPrice: 0, bestBidPrice: 0, underlyingPrice: 0 })
  //     )
  //   }
  // }

  // private ensureMessage(o: OptionSummary): RequiredOptionSummary {
  //   return {
  //     ...o,
  //     bestAskPrice: o.bestAskPrice ?? 0,
  //     bestBidPrice: o.bestBidPrice ?? 0,
  //     markPrice: o.markPrice ?? 0,
  //     underlyingPrice: o.underlyingPrice ?? 0,
  //     name: o.name ?? "unknown"
  //   }
  // }

  private async summaryStream(breakOnFirstSuccess = false): Promise<Index | undefined> {
    let lastReport = dayjs(this.refDate).subtract(1, "minute")
    let breakOnData = false

    for await (const message of this.createStream()) {
      // if (dayjs.utc(message.timestamp).isSameOrAfter("2022-01-01T05:33:55.249Z")) {
      //   breakOnData = true
      //   const { symbol, timestamp } = message
      //   this.logger?.info(">>>", { symbol, timestamp })
      // }

      let ts = dayjs.utc(message.timestamp).startOf("second")
      ts = ts.add(5 - (ts.second() % 5), "seconds")

      this.midBook.set(message.symbol, message)

      if (ts.diff(lastReport, "ms") >= this.reportFrequency) {
        try {
          // this.logger?.debug("midBook.stats", { entries: this.midBook.size })
          // if (breakOnData) {
          //   debugger
          // }

          const _index = this.calculateIndex(message)

          if (_index) {
            this.index = _index
            // this.log.set(ts.toISOString(), _index)
          }
        } catch (err) {
          this.index = undefined
          // console.debug("Failed to calculate index @ %s", ts.toISOString(), err)
          // "burn in"
        }

        lastReport = ts
        // this.onCompute({ time: ts.toISOString(), value: this.index ?? 0 })
        if (this.index) {
          this.onCompute(this.index)
        }
      }

      if (breakOnFirstSuccess && this.index) break

      if (ts.diff(this.startDate, "ms") >= this.maxDuration) {
        console.log("Got messages outside of query period, done streaming.")
        break
      }

      if (ts.isSameOrAfter(this.expiries.rolloverAt)) {
        console.log("Rolling over", ts.toISOString())
        this.refDate = dayjs.utc(this.expiries.rolloverAt)
        // this.midBook.clear()

        this.deleteNearEntries()

        this.expiries = await buildExpiries({
          now: this.refDate.toISOString(),
          timePeriod: this.timePeriod,
          exchange: "deribit",
          asset: this.asset
        })

        return await this.summaryStream()
      }
    }

    this.onComplete()

    return this.index
  }

  private calculateIndex(message: OptionSummary): Index {
    const underlyingPrice = message.underlyingPrice ?? 0
    const interestRate = getInterestRate()
    let mfivContext: MfivContext = {
        ...interestRate,
        timePeriod: this.timePeriodOption,
        exchange: "deribit",
        methodology: MethodologyEnum.MFIV,
        asset: this.asset
      },
      mfivParams: MfivParams = {
        at: message.timestamp.toISOString(),
        nearDate: this.expiries.nearExpiry,
        nextDate: this.expiries.nextExpiry,
        options: Array.from(this.midBook.values()) as MfivOptionSummary[],
        underlyingPrice: message.underlyingPrice ?? 0
      }

    const mfivResult: MfivResult = compute(mfivContext, mfivParams)
    const { asset, dVol, invdVol, value, methodology, estimatedFor } = mfivResult
    const index: Index = {
      ...interestRate,
      asset,
      timePeriod: this.timePeriodOption,
      dVol: dVol ?? 0,
      invdVol: invdVol ?? 0,
      value: value ?? 0,
      methodology: methodology as MethodologyEnum,
      timestamp: estimatedFor,
      underlyingPrice,
      nearExpiry: this.expiries.nearExpiry,
      nextExpiry: this.expiries.nextExpiry
    }

    // if (mfivResult.estimatedFor.startsWith("2022-05-06T18:15:05")) {
    //   fs.writeFile(
    //     "./may26-evidence.json",
    //     JSON.stringify({
    //       version: "2022-03-22",
    //       type: "mfiv.estimate.evidence",
    //       metadata: {},
    //       context: mfivContext,
    //       params: mfivParams,
    //       result: mfivResult
    //     }),
    //     err => {
    //       if (err) {
    //         console.error(err)
    //         return
    //       }
    //       //file written successfully
    //     }
    //   )

    // console.log("mfiv context", JSON.stringify(mfivContext))
    // console.log("mfiv params", JSON.stringify(mfivParams))
    // console.log("mfiv result", JSON.stringify(mfivResult))
    // console.log("input options", JSON.stringify(mfivParams.options))
    //}

    return index
  }

  private deleteNearEntries() {
    const $near = dayjs.utc(this.expiries.nearExpiry)
    chainFrom(Array.from(this.midBook.values()))
      .filter((o: OptionSummary) => $near.isSame(o.expirationDate))
      .forEach((o: OptionSummary) => this.midBook.delete(o.symbol))
  }
}

const getInterestRate = () => {
  return {
    risklessRate: 0.0056,
    risklessRateAt: "2022-03-17T17:17:00.702Z",
    risklessRateSource: "AAVE"
  }
}
