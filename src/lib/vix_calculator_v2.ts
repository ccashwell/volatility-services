import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import utc from "dayjs/plugin/utc"
import {
  Asset,
  compute,
  MfivContext,
  MfivParams,
  MfivResult,
  OptionSummary as MfivOptionSummary
} from "node-volatility-mfiv"
import {
  getInstrumentInfo,
  normalizeOptionsSummary,
  OptionSummary,
  replayNormalized,
  streamNormalized
} from "tardis-dev"
import { MethodologyEnum } from "./../entities/types"

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(isSameOrAfter)

const DERIBIT_DATE_FORMAT = "DMMMYY"
const API_KEY = "TD.to6g6hrAi1IF-cry.LYFonb8PxeLnWRM.9IO46aP0s1m03kA.buSdKQHw6-tMWFs.BZwEKGswTrx-JqQ.INRt"

type MidBook = (string | number)[][]

export type VixConfig = {
  replayFrom: string
  replayTo: string
  // maxDuration?: number
  // referenceDate?: dayjs.Dayjs | string
  reportFrequency?: number
  rolloverFrequency: "weekly" | "semiweekly"
  asset: Asset
  onCompute?: (index: Index) => void
  onComplete?: () => void
  onError?: (err: unknown) => void
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
} & ReturnType<typeof getInterestRate>

export type VixResult = {
  at: dayjs.Dayjs | string
  index: number
  log?: Index[]
}

// type RequiredOptionSummary = Required<
//   Pick<OptionSummary, "markPrice" | "timestamp" | "expirationDate" | "name" | "strikePrice" | "optionType" | "type">
// > & { bestBidPrice: number; bestAskPrice: number; underlyingPrice: number; markPrice: number }

interface MidBookItem {
  name: string | undefined
  expirationDate: Date
  symbol: string
  underlyingPrice: number
  bestBidPrice: number
  bestAskPrice: number
  markPrice: number
  strikePrice: number
}

export class VixCalculatorV2 {
  refDate: dayjs.Dayjs
  startDate: dayjs.Dayjs
  rolloverAt!: dayjs.Dayjs
  nearExpiry!: dayjs.Dayjs
  nextExpiry!: dayjs.Dayjs
  risklessRate: number

  reportFrequency: number
  rolloverFrequency: string
  maxDuration: number

  asset: Asset
  nearOptionList: string[] = []
  nextOptionList: string[] = []

  index: Index | undefined

  log: Map<string, number> = new Map<string, number>()
  // key = id, value = OptionSummary
  midBook: Map<string, number> = new Map<string, number>()
  // midBook: Map<string, RequiredOptionSummary> = new Map<string
  // summary: Map<string, OptionSummary> = new Map<string, OptionSummary>()
  summary: Map<string, OptionSummary> = new Map<string, OptionSummary>()

  onCompute: (index: Index) => void
  onComplete: () => void
  onError: (err: unknown) => void

  constructor(config: VixConfig) {
    this.refDate = dayjs.utc(config.replayFrom).startOf("minute")
    this.startDate = dayjs.utc(config.replayFrom).startOf("minute")
    this.rolloverFrequency = config.rolloverFrequency
    this.risklessRate = getInterestRate().risklessRate
    this.maxDuration = dayjs
      .utc(config.replayTo)
      .diff(this.refDate) /* config.maxDuration ?? dayjs.duration(10, "seconds").asMilliseconds() */
    this.asset = config.asset
    this.onCompute = config.onCompute ?? (() => false)
    this.onComplete = config.onComplete ?? (() => false)
    this.onError = config.onError ?? ((err: unknown) => false)
    this.reportFrequency = config.reportFrequency ?? dayjs.duration(5, "seconds").asMilliseconds()

    this.setupRollover()
  }

  async fetchIndex(): Promise<VixResult> {
    await this.buildOptionLists()
    await this.summaryStream()

    const avgIndex = Array.from(this.log.values()).reduce((out, index) => (out += index), 0) / this.log.size

    return {
      at: this.refDate.toISOString(),
      index: avgIndex
      // log: Array.from(this.log).map(([time, value]) => ({ time, value }))
    }
  }

  private createStream(): AsyncIterableIterator<OptionSummary> {
    const symbols = [...this.nearOptionList, ...this.nextOptionList]
    const maxRef = dayjs.utc(this.refDate).add(this.maxDuration, "ms")

    console.log("Starting new stream", {
      initialRef: this.startDate.toISOString(),
      currentRef: this.refDate.toISOString(),
      maxRef: maxRef.toISOString(),
      near: this.nearExpiry.toISOString(),
      next: this.nextExpiry.toISOString(),
      symbolGroups: Array.from(new Set(symbols.map(s => s.split("-")[1])))
    })

    if (this.refDate.isBefore(dayjs.utc().startOf("minute"))) {
      return replayNormalized(
        {
          apiKey: API_KEY,
          exchange: "deribit",
          symbols,
          from: dayjs.utc(this.refDate).toISOString(),
          to: (maxRef.isAfter(this.rolloverAt) ? this.rolloverAt : maxRef).toISOString(),
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

    for await (const message of this.createStream()) {
      let ts = dayjs.utc(message.timestamp).startOf("second")
      ts = ts.add(5 - (ts.second() % 5), "seconds")

      // this.cacheMessage(message)
      // this.midBookChange(message)
      this.summary.set(message.symbol, message)

      if (ts.diff(lastReport, "ms") >= this.reportFrequency) {
        try {
          const _index = this.calculateIndex(message)

          if (_index) {
            this.index = _index
            // this.log.set(ts.toISOString(), _index)
          }
        } catch (err) {
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

      if (ts.isSameOrAfter(this.rolloverAt)) {
        console.log("Rolling over", ts.toISOString())
        this.refDate = dayjs.utc(this.rolloverAt)
        this.setupRollover()

        // this.midBook.clear();
        this.summary.clear()

        await this.buildOptionLists()
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
        timePeriod: "14D",
        exchange: "deribit",
        methodology: MethodologyEnum.MFIV,
        asset: this.asset
      },
      mfivParams: MfivParams = {
        at: message.timestamp.toISOString(),
        nearDate: this.nearExpiry.toISOString(),
        nextDate: this.nextExpiry.toISOString(),
        options: Array.from(this.summary.values()) as MfivOptionSummary[],
        underlyingPrice: message.underlyingPrice ?? 0
      }

    const mfivResult: MfivResult = compute(mfivContext, mfivParams)
    const { asset, dVol, invdVol, value, methodology, estimatedFor } = mfivResult
    const index: Index = {
      ...interestRate,
      asset,
      dVol: dVol ?? 0,
      invdVol: invdVol ?? 0,
      value: value ?? 0,
      methodology: methodology as MethodologyEnum,
      timestamp: estimatedFor,
      underlyingPrice
    }

    // if (mfivResult.estimatedFor.startsWith("2021-05-26T20:09:00")) {
    //   console.log("mfiv result", JSON.stringify(mfivResult))
    //   console.log("input options", JSON.stringify(mfivParams.options))
    // }

    return index
  }

  private async buildOptionLists(): Promise<string[]> {
    const instruments = await getInstrumentInfo("deribit", {
      type: "option",
      baseCurrency: this.asset
    })

    const nearExpiry = this.nearExpiry.toISOString()
    const nextExpiry = this.nextExpiry.toISOString()
    this.nearOptionList = []
    this.nextOptionList = []

    for (const instrument of instruments) {
      if (instrument.expiry === undefined) {
        continue
      }

      const { expiry } = instrument

      if (expiry === nearExpiry) {
        this.nearOptionList.push(instrument.id)
      }

      if (expiry === nextExpiry) {
        this.nextOptionList.push(instrument.id)
      }
    }

    return [...this.nearOptionList, ...this.nextOptionList]
  }

  private setupRollover(): void {
    this.rolloverWeekly()
  }

  /**
   * Rollover once per week. Targets the first Friday 14+ days out and the one before it.
   */
  private rolloverWeekly(): void {
    console.log("Finding new weekly rollover", this.refDate.toISOString())

    // find first Friday after target day
    if (this.refDate.day() === 5 && this.refDate.hour() >= 8) {
      this.nextExpiry = dayjs.utc(this.refDate).hour(8).startOf("hour").add(21, "days")
    } else if (this.refDate.day() === 6) {
      this.nextExpiry = dayjs.utc(this.refDate).hour(8).startOf("hour").add(20, "days")
    } else {
      this.nextExpiry = dayjs
        .utc(this.refDate)
        .hour(8)
        .startOf("hour")
        .add(19 - this.refDate.day(), "days")
    }

    // near is always exactly 1 week before next
    this.nearExpiry = dayjs.utc(this.nextExpiry).subtract(7, "days")

    // rollover happens 14 days before next
    this.rolloverAt = dayjs.utc(this.nextExpiry).subtract(14, "days")

    console.log(
      "New weekly rollovers found",
      this.rolloverAt.toISOString(),
      this.nearExpiry.toISOString(),
      this.nextExpiry.toISOString()
    )
  }
}

const getInterestRate = () => {
  return {
    risklessRate: 0.0056,
    risklessRateAt: "2022-03-17T17:17:00.702Z",
    risklessRateSource: "AAVE"
  }
}
