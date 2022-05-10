import { Computable, Exchange, NormalizedData, OptionSummary, Writeable } from "tardis-dev"

export type OptionBucket = {
  readonly type: "option_bucket"
  readonly symbol: string
  readonly exchange: Exchange
  readonly name: string
  readonly interval: number
  readonly kind: "time"
  readonly id: string | undefined

  readonly summaries: number
  readonly openTimestamp: Date
  readonly closeTimestamp: Date
  readonly underlyingPrice: number
  readonly lastPrice: number
  readonly strikePrice: number
  readonly expirationDate: Date
  readonly optionType: "call" | "put"
  readonly delta: number
  readonly markIV: number

  readonly timestamp: Date
  readonly localTimestamp: Date
}

interface OptionBucketComputableOptions {
  kind: BucketKind
  interval: number
  name?: string
}

type BucketKind = "time"

const kindSuffix: { [key in BucketKind]: string } = {
  time: "sec"
}

const DATE_MIN = new Date(-1)

export class OptionBucketComputable implements Computable<OptionBucket> {
  public readonly sourceDataTypes = ["option_summary"]

  private _inProgress: Writeable<OptionBucket>
  private readonly _kind: BucketKind
  private readonly _interval: number
  private readonly _name: string
  private readonly _type = "option_bucket"

  constructor({ kind, interval, name }: OptionBucketComputableOptions) {
    this._kind = kind
    this._interval = interval

    if (name === undefined) {
      this._name = `${this._type}_${interval}${kindSuffix[kind]}`
    } else {
      this._name = name
    }

    this._inProgress = {} as any
    this._reset()
  }

  public *compute(message: OptionSummary): IterableIterator<OptionBucket> {
    if (this._hasNewBucket(message.timestamp)) {
      yield this._computeBucket(message)
    }

    if (message.type !== "option_summary") {
      return
    }

    // update in progress bucket with new data
    this._update(message)

    // and check again if there is a new trade bar after the update (volume/tick based trade bars)
    if (this._hasNewBucket(message.timestamp)) {
      yield this._computeBucket(message)
    }
  }

  private _computeBucket(message: NormalizedData) {
    this._inProgress.localTimestamp = message.localTimestamp
    this._inProgress.symbol = message.symbol
    this._inProgress.exchange = message.exchange

    const option: OptionBucket = { ...this._inProgress }

    this._reset()

    return option
  }

  private _hasNewBucket(timestamp: Date): boolean {
    if (this._inProgress.summaries === 0) {
      return false
    }

    if (this._kind === "time") {
      const currentTimestampTimeBucket = this._getTimeBucket(timestamp)
      const openTimestampTimeBucket = this._getTimeBucket(this._inProgress.openTimestamp)
      if (currentTimestampTimeBucket > openTimestampTimeBucket) {
        // set the timestamp to the end of the period of given bucket
        this._inProgress.timestamp = new Date((openTimestampTimeBucket + 1) * this._interval)

        return true
      }

      return false
    }

    return false
  }

  private _update(option: OptionSummary) {
    const inProgress = this._inProgress
    const isNotOpenedYet = inProgress.summaries === 0

    if (isNotOpenedYet) {
      inProgress.openTimestamp = option.timestamp
    }

    inProgress.id = option.symbol
    inProgress.underlyingPrice = option.underlyingPrice ?? 0
    inProgress.lastPrice = option.lastPrice ?? 0
    inProgress.strikePrice = option.strikePrice
    inProgress.timestamp = option.timestamp
    inProgress.closeTimestamp = option.timestamp
    inProgress.localTimestamp = option.localTimestamp
    inProgress.expirationDate = option.expirationDate
    inProgress.optionType = option.optionType
    inProgress.delta = option.delta ?? 0
    inProgress.markIV = option.markIV ?? 0

    inProgress.summaries += 1
  }

  private _reset() {
    const bucketToReset = this._inProgress
    bucketToReset.type = this._type
    bucketToReset.symbol = ""
    bucketToReset.exchange = "" as any
    bucketToReset.name = this._name
    bucketToReset.interval = this._interval
    bucketToReset.kind = this._kind
    bucketToReset.underlyingPrice = 0
    bucketToReset.lastPrice = 0
    bucketToReset.underlyingPrice = 0
    bucketToReset.strikePrice = 0
    bucketToReset.delta = 0
    bucketToReset.markIV = 0
    bucketToReset.id = undefined
    bucketToReset.summaries = 0
    bucketToReset.openTimestamp = DATE_MIN
    bucketToReset.closeTimestamp = DATE_MIN
    bucketToReset.localTimestamp = DATE_MIN
    bucketToReset.timestamp = DATE_MIN
    bucketToReset.expirationDate = DATE_MIN
  }

  private _getTimeBucket(timestamp: Date) {
    return Math.floor(timestamp.valueOf() / this._interval)
  }
}

export const computeOptionBucket =
  (options: OptionBucketComputableOptions): (() => Computable<OptionBucket>) =>
  () =>
    new OptionBucketComputable(options)
