import { OptionPrice, OptionSummary } from "../types"

export interface OptionPair<T extends OptionSummary & OptionPrice> {
  readonly baseSymbol: string
  readonly strikePrice: number
  readonly expirationDate: Date
  call?: T
  put?: T
  $call: number | undefined
  $put: number | undefined

  insert(option: T): OptionPair<T>
  diff(): number
}

/**
 * Represents a pairing of a put and call option at the same strike and expiration.
 *
 * The only guarantee is that either the call, put, or both are contained in an instance.
 * There are no requirements that an instance contains both a call and a put.
 */
// export class BaseOptionPair<T extends OptionSummary & OptionPrice> implements OptionPair<T> {
export class BaseOptionPair<T extends OptionSummary & OptionPrice> implements OptionPair<T> {
  call?: T
  put?: T

  constructor(public baseSymbol: string, public strikePrice: number, public expirationDate: Date) {}

  insert(item: T): OptionPair<T> {
    item.optionType == "call" ? (this.call = item) : (this.put = item)
    return this
  }

  /**
   * Get the call option's price
   *
   * @returns number | undefined
   */
  get $call() {
    return this.call?.optionPrice
  }

  /**
   * Get the put option's mid price
   *
   * @returns number | undefined
   */
  get $put() {
    return this.put?.optionPrice
  }

  /**
   * Compute the absolute difference
   *
   * @returns number | NaN
   */
  diff() {
    if (this.$call && this.$put) {
      return Math.abs(this.$call - this.$put)
    }

    return NaN
  }
}

export const toMapOfOptionPair = <T extends OptionSummary & OptionPrice>(options: T[]) => {
  return options.reduce((acc, current) => {
    const baseSymbol = makeMapKey(current)
    const { strikePrice, expirationDate } = current
    const optionPair = acc.get(baseSymbol) ?? new BaseOptionPair<T>(baseSymbol, strikePrice, expirationDate)

    optionPair.insert(current)

    return acc.set(baseSymbol, optionPair)
  }, newOptionPairMap())
}

/**
 * Take the instrument's symbol and strip off the call/put designator so it can be used as
 * a key to call and put options.
 *
 * @param o OptionSummary that will have the '-C' or '-P' stripped out of the name
 * @returns string - lacking any designation of call or put
 */
const makeMapKey = (o: OptionSummary) => o.symbol.slice(0, -2)
const newOptionPairMap = <T extends OptionSummary & OptionPrice>() => new Map<string, OptionPair<T>>()
