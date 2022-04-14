import { Computable, Exchange, NormalizedData, Trade, Writeable } from "tardis-dev"

export type TradeBucket = {
  readonly type: "trade_bucket"
  readonly symbol: string
  readonly exchange: Exchange
  readonly name: string
  readonly interval: number
  readonly kind: "time"
  readonly id: string | undefined

  readonly trades: number
  readonly openTimestamp: Date
  readonly closeTimestamp: Date
  readonly price: number

  readonly timestamp: Date
  readonly localTimestamp: Date
}

interface TradeBucketComputableOptions {
  kind: BucketKind
  interval: number
  name?: string
}

type BucketKind = "time"

const kindSuffix: { [key in BucketKind]: string } = {
  time: "sec"
}

const DATE_MIN = new Date(-1)

export class TradeBucketComputable implements Computable<TradeBucket> {
  public readonly sourceDataTypes = ["trade"]

  private _inProgress: Writeable<TradeBucket>
  private readonly _kind: BucketKind
  private readonly _interval: number
  private readonly _name: string
  private readonly _type = "trade_bucket"

  constructor({ kind, interval, name }: TradeBucketComputableOptions) {
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

  public *compute(message: Trade): IterableIterator<TradeBucket> {
    if (this._hasNewBucket(message.timestamp)) {
      yield this._computeBucket(message)
    }

    if (message.type !== "trade") {
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

    const trade: TradeBucket = { ...this._inProgress }

    this._reset()

    return trade
  }

  private _hasNewBucket(timestamp: Date): boolean {
    if (this._inProgress.trades === 0) {
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

  private _update(trade: Trade) {
    const inProgress = this._inProgress
    const isNotOpenedYet = inProgress.trades === 0

    if (isNotOpenedYet) {
      inProgress.openTimestamp = trade.timestamp
    }

    inProgress.id = trade.id
    inProgress.price = trade.price
    inProgress.timestamp = trade.timestamp
    inProgress.closeTimestamp = trade.timestamp
    inProgress.localTimestamp = trade.localTimestamp
    inProgress.trades += 1
  }

  private _reset() {
    const bucketToReset = this._inProgress
    bucketToReset.type = this._type
    bucketToReset.symbol = ""
    bucketToReset.exchange = "" as any
    bucketToReset.name = this._name
    bucketToReset.interval = this._interval
    bucketToReset.kind = this._kind
    bucketToReset.price = 0
    bucketToReset.id = undefined
    bucketToReset.trades = 0
    bucketToReset.openTimestamp = DATE_MIN
    bucketToReset.closeTimestamp = DATE_MIN
    bucketToReset.localTimestamp = DATE_MIN
    bucketToReset.timestamp = DATE_MIN
  }

  private _getTimeBucket(timestamp: Date) {
    return Math.floor(timestamp.valueOf() / this._interval)
  }
}

export const computeTradeBucket =
  (options: TradeBucketComputableOptions): (() => Computable<TradeBucket>) =>
  () =>
    new TradeBucketComputable(options)
