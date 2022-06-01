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
  options: Map<string, OptionSummary> = new Map<string, OptionSummary>()

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
    const replayTo = maxRef.isAfter(this.expiries.rolloverAt) ? this.expiries.rolloverAt : maxRef.toISOString()

    this.logger?.info("createStream()", {
      initialRef: this.startDate.toISOString(),
      currentRef: this.refDate.toISOString(),
      maxRef: maxRef.toISOString(),
      near: this.expiries.nearExpiry,
      next: this.expiries.nextExpiry,
      active: this.expiries.expiryList,
      total: this.expiries.expiryList.length,
      rolloverAt: this.expiries.rolloverAt,
      replayFrom: dayjs.utc(this.refDate).toISOString(),
      replayTo
    })

    const sortFn = (a: string, b: string) => {
      return b === a ? 0 : b < a ? 1 : -1
    }

    const symbols = [
      ...this.expiries.nearSymbols.sort(sortFn),
      ...this.expiries.nextSymbols.sort(sortFn),
      ...(this.expiries.expiryMap.get(this.expiries.expiryList[0]) ?? [])
    ]

    if (this.refDate.isBefore(dayjs.utc().startOf("minute"))) {
      return replayNormalized(
        {
          apiKey: this.apiKey,
          exchange: this.exchange as "deribit" | "binance-options" | "okex-options",
          symbols,
          from: dayjs.utc(this.refDate).toISOString(),
          to: replayTo,
          waitWhenDataNotYetAvailable: true
          /* autoCleanup: true */
        },
        normalizeOptionsSummary
      )
    } else {
      return streamNormalized(
        {
          exchange: this.exchange as "deribit" | "binance-options" | "okex-options",
          symbols
        },
        normalizeOptionsSummary
      )
    }
  }

  private async summaryStream(breakOnFirstSuccess = false): Promise<Index | undefined> {
    let lastReport = dayjs(this.refDate).subtract(1, "minute")
    let breakOnData = false

    const $nearExpiry = dayjs.utc(this.expiries.nearExpiry)
    const $nextExpiry = dayjs.utc(this.expiries.nextExpiry)
    // const marker = dayjs.utc().valueOf()

    for await (const message of this.createStream()) {
      /**
       * Don't compute mfiv for options we are subscribed to but are in the future.
       */
      if (!$nearExpiry.isSame(message.expirationDate) && !$nextExpiry.isSame(message.expirationDate)) {
        this.options.set(message.symbol, message)
        continue
      }

      this.midBook.set(message.symbol, message)

      let ts = dayjs.utc(message.timestamp).startOf("second")
      ts = ts.add(5 - (ts.second() % 5), "seconds")

      if (ts.diff(lastReport, "ms") >= this.reportFrequency && message.expirationDate) {
        try {
          // this.logger?.info("reporting", {
          //   marker,
          //   symbol: message.symbol,
          //   timestamp: message.timestamp,
          //   localTimestamp: message.localTimestamp
          // })
          const _index = this.calculateIndex(message)

          if (_index) {
            this.index = _index
          }
        } catch (err) {
          // "burn in"
          this.index = undefined
          this.logger?.debug(`Failed to calculate index @ ${ts.toISOString()}`, err)
        }

        lastReport = ts
        // this.onCompute({ time: ts.toISOString(), value: this.index ?? 0 })
        if (this.index) {
          this.onCompute(this.index)
        }
      }

      if (breakOnFirstSuccess && this.index) break

      if (ts.diff(this.startDate, "ms") >= this.maxDuration) {
        this.logger?.info("Got messages outside of query period, done streaming.")
        break
      }

      if (ts.isSameOrAfter(this.expiries.rolloverAt)) {
        this.logger?.info("Rolling over", ts.toISOString())
        this.refDate = dayjs.utc(this.expiries.rolloverAt)

        this.expiries = await buildExpiries({
          now: this.refDate.toISOString(),
          timePeriod: this.timePeriod,
          exchange: "deribit",
          asset: this.asset
        })

        /** If we have a new near expiry, then delete the old one. */
        if (!$nearExpiry.isSame(this.expiries.nearExpiry)) {
          this.logger?.info("Remove old nearExpiry")
          this.deleteEntries($nearExpiry)

          /** Copy the future options we've been streaming into the midBook */
          const $newNextExpiry = dayjs.utc(this.expiries.nextExpiry)

          this.logger?.info("Copy new nextExpiry values =", $newNextExpiry.toISOString())
          this.logger?.info("midBook current size =", this.midBook.size)

          chainFrom(this.options.values())
            .filter(o => $newNextExpiry.isSame(o.expirationDate))
            .forEach(o => this.midBook.set(o.symbol, o))

          this.logger?.info("midBook new size =", this.midBook.size)

          this.options.clear()
        }

        return await this.summaryStream()
      }
    }

    this.onComplete()

    return this.index
  }

  private calculateIndex(message: OptionSummary): Index {
    const underlyingPrice = message.underlyingPrice ?? 0
    const interestRate = getInterestRate()
    const { nearExpiry, nextExpiry } = this.expiries
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

    return index
  }

  private deleteEntries(targetExpiration: dayjs.Dayjs) {
    /** Remove near options from midBook */
    chainFrom(Array.from(this.midBook.values()))
      .filter((o: OptionSummary) => targetExpiration.isSame(o.expirationDate))
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
