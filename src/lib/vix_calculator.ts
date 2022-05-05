import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import utc from "dayjs/plugin/utc"
import { Asset } from "node-volatility-mfiv"
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
} & ReturnType<typeof getInterestRate>

export type VixResult = {
  at: dayjs.Dayjs | string
  index: number
  log?: Index[]
}

export class VixCalculator {
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

  index: number | null = null
  invdVol: number | undefined

  log: Map<string, number> = new Map<string, number>()
  midBook: Map<string, number> = new Map<string, number>()
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
      initialRef: this.startDate,
      currentRef: this.refDate,
      maxRef: maxRef,
      near: this.nearExpiry,
      next: this.nextExpiry,
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

  private async summaryStream(breakOnFirstSuccess = false): Promise<number> {
    let lastReport = dayjs(this.refDate).subtract(1, "minute")

    for await (const message of this.createStream()) {
      let ts = dayjs.utc(message.timestamp).startOf("second")
      ts = ts.add(5 - (ts.second() % 5), "seconds")

      this.midBookChange(message)
      // this.summary.set(message.symbol, message);

      try {
        const _index = this.calculateIndex()

        if (_index) {
          this.index = _index
          this.log.set(ts.toISOString(), _index)
        }
      } catch (err) {
        console.debug("Failed to calculate index @ %s", ts.toISOString(), err)
        // "burn in"
      }

      if (ts.diff(lastReport, "ms") >= this.reportFrequency) {
        lastReport = ts
        // this.onCompute({ time: ts.toISOString(), value: this.index ?? 0 })
        this.onCompute({
          ...getInterestRate(),
          value: this.index ?? 0,
          dVol: this.index ?? 0,
          invdVol: this.invdVol ?? 0,
          timestamp: ts.toISOString(),
          asset: this.asset,
          methodology: MethodologyEnum.MFIV
        })
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

    return this.index ?? 0
  }

  private calculateIndex() {
    const NT1 = this.nearExpiry.valueOf() - this.refDate.valueOf()
    const NT2 = this.nextExpiry.valueOf() - this.refDate.valueOf()
    const N14 = dayjs.duration(2, "weeks").asMilliseconds()
    const N365 = dayjs.duration(1, "year").asMilliseconds()

    const T1_year = NT1 / N365
    const T2_year = NT2 / N365

    const f1 = this.forwardPriceGet(this.nearOptionList)
    const f2 = this.forwardPriceGet(this.nextOptionList)

    const f1_strike = this.adjacentStrikeGet(this.nearOptionList, f1)
    const f2_strike = this.adjacentStrikeGet(this.nextOptionList, f2)

    const nearEntries = this.filterBook(this.nearExpiry)
    const nextEntries = this.filterBook(this.nextExpiry)

    const nearFinalBook = this.finalBookGet(nearEntries, f1_strike)
    const nextFinalBook = this.finalBookGet(nextEntries, f2_strike)

    const nearContribution = this.contributionGet(nearFinalBook)
    const nextContribution = this.contributionGet(nextFinalBook)

    const modSigmaSquared_1 = Math.E ** (this.risklessRate * T1_year) * 2 * nearContribution - (f1 / f1_strike - 1) ** 2
    const modSigmaSquared_2 = Math.E ** (this.risklessRate * T2_year) * 2 * nextContribution - (f2 / f2_strike - 1) ** 2

    const A = (NT2 - N14) / (NT2 - NT1)
    const B = (N14 - NT1) / (NT2 - NT1)
    const C = N365 / N14

    const dVol = Math.sqrt((modSigmaSquared_1 * A + modSigmaSquared_2 * B) * C)

    this.index = 100 * dVol
    this.invdVol = 100.0 * (1.0 / dVol)

    return this.index
  }

  private midBookChange(message: OptionSummary) {
    const { symbol, underlyingPrice, bestBidPrice, bestAskPrice, markPrice } = message

    const bid = (bestBidPrice ?? 0) * (underlyingPrice ?? 0)
    const ask = (bestAskPrice ?? 0) * (underlyingPrice ?? 0)
    const mark = (markPrice ?? 0) * (underlyingPrice ?? 0)

    let mid: number | undefined
    if (!bid || isNaN(bid)) {
      mid = undefined
    } else if (isNaN(ask)) {
      mid = mark
    } else {
      mid = (ask + bid) / 2
      if (mid >= 1.5 * mark) {
        mid = mark
      }
    }

    // console.log(symbol, { bid, ask, mark, mid });
    if (mid) this.midBook.set(symbol, mid)
  }

  private contributionGet(finalBook: MidBook) {
    let thisStrike: number, nextStrike: number, previousStrike: number, deltaK: number, thisPrice: number

    let contribution = 0
    for (let i = 0; i < finalBook.length; i++) {
      const i0 = finalBook[i][0] as string

      if (i === 0) {
        const nextVal = finalBook[i + 1][0] as string

        thisStrike = Number(i0.split("-")[2])
        nextStrike = Number(nextVal.split("-")[2])
        deltaK = nextStrike - thisStrike
        thisPrice = Number(finalBook[i][1])
        contribution = contribution + (deltaK / thisStrike ** 2) * thisPrice
      } else if (i === finalBook.length - 1) {
        const prevVal = finalBook[i - 1][0] as string

        thisStrike = Number(i0.split("-")[2])
        previousStrike = Number(prevVal.split("-")[2])
        deltaK = thisStrike - previousStrike
        thisPrice = Number(finalBook[i][1])
        contribution = contribution + (deltaK / thisStrike ** 2) * thisPrice
      } else {
        const nextVal = finalBook[i + 1][0] as string
        const prevVal = finalBook[i - 1][0] as string

        thisStrike = Number(i0.split("-")[2])
        previousStrike = Number(prevVal.split("-")[2])
        nextStrike = Number(nextVal.split("-")[2])
        deltaK = (nextStrike - previousStrike) / 2
        thisPrice = Number(finalBook[i][1])
        contribution = contribution + (deltaK / thisStrike ** 2) * thisPrice
      }
    }

    return contribution
  }

  private filterBook(expiry: dayjs.Dayjs): [string, number][] {
    return Array.from(this.midBook).filter(([key, value]) => {
      return !isNaN(value) && key.includes(this.expirationDateToString(expiry))
    })
  }

  private finalBookGet(entries: [string, number][], targetStrike: number) {
    const avg = []
    const finalBook = []

    // find the puts below the strike, the calls above the strike, and both the put and call AT the strike
    for (const entry of entries) {
      const strike = Number(entry[0].split("-")[2])
      const type = entry[0].split("-")[3]

      if ((strike < targetStrike && type === "P") || (strike > targetStrike && type === "C")) {
        finalBook.push(entry)
      } else if (strike === targetStrike) {
        avg.push(entry)
      }
    }

    // add to the list the average of the call and put prices at the strike
    const avgOption = [avg[0][0] + "AV", (avg[0][1] + avg[1][1]) / 2]
    finalBook.push(avgOption)

    // sort by strike price
    return finalBook.sort((a, b) => {
      const aStr = a[0] as string,
        bStr = b[0] as string

      return Number(aStr.split("-")[2]) - Number(bStr.split("-")[2])
    })
  }

  private forwardPriceGet(thisOptionList: string[]) {
    let bestReducedOption: string = ""
    let smallestDiff = Infinity
    let bestStrike: number = 0
    let bestCallPrice: number = 0
    let bestPutPrice: number = 0

    const list = new Set<string>(thisOptionList.map((x: string) => x.split("-").slice(0, -1).join("-")))

    for (const option of Array.from(list)) {
      const callMid = this.midBook.get(option + "-C")
      const putMid = this.midBook.get(option + "-P")
      const diff = callMid === undefined || putMid === undefined ? NaN : Math.abs(callMid - putMid)
      if (!isNaN(diff)) {
        if (diff < smallestDiff) {
          smallestDiff = diff
          bestReducedOption = option
          bestStrike = Number(option.split("-").slice(-1))
          bestCallPrice = callMid as number
          bestPutPrice = putMid as number
        }
      }
    }

    const expiration = dayjs.utc(bestReducedOption.split("-")[1], DERIBIT_DATE_FORMAT)

    const yearFractionToExpiration =
      this.msToExpiration(expiration.valueOf()) / dayjs.duration(1, "year").asMilliseconds()

    const forwardPrice =
      bestStrike + Math.E ** (this.risklessRate * yearFractionToExpiration) * (bestCallPrice - bestPutPrice)
    return forwardPrice
  }

  private msToExpiration(expiration: number) {
    return dayjs.utc(expiration).diff(this.refDate, "ms")
  }

  private adjacentStrikeGet(optionList: string[], forwardPrice: number) {
    let adjacentStrike = 0

    for (const option of optionList) {
      const thisStrike = Number(option.split("-")[2])
      if (thisStrike <= forwardPrice && thisStrike > adjacentStrike) {
        adjacentStrike = thisStrike
      }
    }

    return adjacentStrike
  }

  private async buildOptionLists(): Promise<string[]> {
    const instruments = await getInstrumentInfo("deribit", {
      type: "option",
      baseCurrency: this.asset
    })

    this.nearOptionList = []
    this.nextOptionList = []

    for (const instrument of instruments) {
      const expiry = instrument.id.split("-")[1]

      if (expiry === this.expirationDateToString(this.nearExpiry)) {
        this.nearOptionList.push(instrument.id)
      }

      if (expiry === this.expirationDateToString(this.nextExpiry)) {
        this.nextOptionList.push(instrument.id)
      }
    }

    return [...this.nearOptionList, ...this.nextOptionList]
  }

  private expirationDateToString(expiration: dayjs.Dayjs | Date | string) {
    return dayjs.utc(expiration).format(DERIBIT_DATE_FORMAT).toUpperCase()
  }

  private setupRollover(): void {
    this.rolloverWeekly()
    // if (this.rolloverFrequency === "weekly") {
    //   return this.rolloverWeekly();
    // } else {
    //   return this.rolloverSemiWeekly();
    // }
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

  /**
   * Rollover twice per week. Targets a rolling average of 14 days out.
   */
  private rolloverSemiWeekly(): void {
    console.log("Finding new semi-weekly rollover", this.refDate.format("lll"))

    this.nearExpiry = dayjs
      .utc(this.refDate)
      .hour(8)
      .startOf("hour")
      .add(12 - this.refDate.day(), "days")

    if (
      (this.refDate.day() === 4 && this.refDate.hour() >= 14) ||
      this.refDate.day() === 5 ||
      this.refDate.day() === 6 ||
      (this.refDate.day() === 0 && this.refDate.hour() <= 2)
    ) {
      this.rolloverAt = dayjs
        .utc(this.refDate)
        .add(7 - this.refDate.day(), "days")
        .hour(2)
        .startOf("hour")

      this.nextExpiry = dayjs
        .utc(this.refDate)
        .hour(8)
        .startOf("hour")
        .add(26 - this.refDate.day(), "days")
    } else {
      this.rolloverAt = dayjs
        .utc(this.refDate)
        .add(4 - this.refDate.day(), "days")
        .hour(14)
        .startOf("hour")

      this.nextExpiry = dayjs
        .utc(this.refDate)
        .hour(8)
        .startOf("hour")
        .add(19 - this.refDate.day(), "days")
    }

    console.log(
      "New semi-weekly rollovers found",
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
