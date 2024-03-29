import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { Asset } from "node-volatility-mfiv"
import { Exchange, getInstrumentInfo, InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"

dayjs.extend(utc)

export interface BuildOptionsListOptions {
  /** compute expiries from 'now' (ISO8601 formatted) */
  now: string
  /** "<integer>D" days (time-period formatted)  */
  timePeriod: number
  /** Exchange to query (tardis option) */
  exchange: Exchange
  /** filter for asset  (tardis option) */
  asset: Asset
}

/**
 * Returned from {@link buildExpiries | Tardis InstrumentInfo service}
 */
export interface Expiries {
  /** list of near, next, and future near/next rollover expiries (iso8601 formatted) */
  expiryList: string[]
  /** (iso8601 date => tardis InstrumentInfo.id[]) */
  expiryMap: Map<string, string[]>
  /** (iso8601 formatted) */
  nearExpiry: string
  /** (iso8601 formatted) */
  nextExpiry: string
  /** (tardis InstrumentInfo.id) */
  nearSymbols: string[]
  /** (tardis InstrumentInfo.id) */
  nextSymbols: string[]
  /** (iso8601 formatted) */
  rolloverAt: string
}

/**
 * @remarks
 * For whatever reason, the JSON contains `listing` but the Tardis typedefinitions do not.
 *
 * @todo Extend tardis type-definition (optionally, submit PR back to tardis)
 */
interface InstrumentInfoWithListing extends Required<InstrumentInfo> {
  listing: string
}

/**
 * Returns the near/next dates and the associated symbols
 *
 * @param options - BuildOptionsListOptions
 * @returns Promise of an Expiries object
 */
export const buildExpiries = async ({
  now,
  timePeriod,
  exchange,
  asset
}: BuildOptionsListOptions): Promise<Expiries> => {
  const available = (o: InstrumentInfoWithListing) => {
    return o.listing <= now && now < o.expiry
  }
  const expiries = await fetchInstruments(exchange, asset)
  const expiryMap = chainFrom(expiries as InstrumentInfoWithListing[])
    .filter(available)
    .toMapGroupBy(o => o.expiry)
  const activeExpiries = Array.from(expiryMap.keys()).sort()
  const $tp = dayjs.utc(now).add(timePeriod, "days")
  let nearIdx = -1
  let nextIdx = -1

  const result = activeExpiries.reduce(
    (prev, curr, cIdx) => {
      const delta = dayjs.utc(curr).diff($tp)

      /**
       * If time delta is negative or zero, then select it as the near expiry IFF it's the smallest diff
       * If time delta is positive, then select it as the next expiry IFF it's the smallest diff
       */
      if (delta <= 0 && delta > prev.nearDiff) {
        nearIdx = cIdx
        prev.nearDiff = delta
        prev.nearExpiry = curr
      } else if (delta > 0 && delta < prev.nextDiff) {
        nextIdx = cIdx
        prev.nextDiff = delta
        prev.nextExpiry = curr
      }

      return prev
    },
    { nearDiff: -Infinity, nextDiff: Infinity, nearExpiry: "", nextExpiry: "" }
  )

  const { nearExpiry, nextExpiry } = result

  const nearSymbols = (expiryMap.get(nearExpiry) || []).map(o => o.id),
    nextSymbols = (expiryMap.get(nextExpiry) || []).map(o => o.id)

  if (nearSymbols.length === 0) {
    throw new Error(`No symbols found with nearExpiry of ${result.nearExpiry}`)
  } else if (nextSymbols.length === 0) {
    throw new Error(`No symbols found with nextExpiry of ${result.nextExpiry}`)
  }

  const rolloverAt = activeExpiries.at(0) as string /*activeExpiries[Math.max(0, nearIdx - 1)]*/
  const pruneList = activeExpiries.slice(0, nextIdx)
  const expiryList = activeExpiries.slice(nextIdx + 1)
  pruneList.forEach(expirationDate => expiryMap.delete(expirationDate))
  const futureOptions: Map<string, string[]> = new Map()

  /** Create a map of future expiries to their symbols */
  for (const [expiry, info] of expiryMap.entries()) {
    futureOptions.set(
      expiry,
      info.map(i => i.id)
    )
  }

  return {
    expiryList,
    expiryMap: futureOptions,
    nearExpiry,
    nextExpiry,
    nearSymbols,
    nextSymbols,
    rolloverAt
  }
}

const fetchInstruments = async (exchange: Exchange, asset: Asset) => {
  return await getInstrumentInfo(exchange, {
    baseCurrency: asset,
    type: "option"
  })
}
