import { MethodologyExpiryEnum } from "@entities"
import { timePeriodToInteger } from "@lib/utils/time_period"
import { Asset } from "node-volatility-mfiv"
import C from "./constants"

export interface MfivExpiry {
  nearExpiration: string
  nextExpiration: string
  rollover: string
  asset?: Asset
}

export const mfivDates = (
  now: Date,
  timePeriod: string,
  expiryType = MethodologyExpiryEnum.FridayT08,
  asset?: Asset
): MfivExpiry => {
  // TODO: Remove guard once we need to support other time ranges.
  const tp = timePeriodToInteger(timePeriod)
  const nextExpirationDate = nextExpiration(now.valueOf(), tp, expiryType)
  const nearExpirationDate = new Date(nextExpirationDate.valueOf() - 7 * C.MILLISECONDS_PER_DAY)
  const rollover = new Date(nextExpirationDate.valueOf() - 14 * C.MILLISECONDS_PER_DAY)

  return {
    nearExpiration: nearExpirationDate.toISOString(),
    nextExpiration: nextExpirationDate.toISOString(),
    rollover: rollover.toISOString(),
    asset
  }
}

const nextExpiration = (dateMs: number, timePeriod: number, expiryType: string) => {
  const expiryMatch = expiryTypeToOrdinals(expiryType)
  const targetDate = new Date(dateMs + C.MILLISECONDS_PER_DAY * timePeriod)
  const targetDay = targetDate.getUTCDay()
  const targetHour = targetDate.getUTCHours()
  let nextDate: Date

  if (targetDay === expiryMatch.expiryDay && targetHour >= expiryMatch.expiryHour) {
    nextDate = new Date(dateMs + 21 * C.MILLISECONDS_PER_DAY)
  } else if (targetDay === expiryMatch.expiryDay + 1) {
    nextDate = new Date(dateMs + 20 * C.MILLISECONDS_PER_DAY)
  } else {
    nextDate = new Date(dateMs + (19 - new Date(dateMs).getUTCDay()) * C.MILLISECONDS_PER_DAY)
  }

  nextDate.setUTCHours(expiryMatch.expiryHour, expiryMatch.expiryMin, expiryMatch.expirySec, 0)
  return nextDate
}

const expiryTypeToOrdinals = (expiryFmt: string) => {
  const [expireDayOfWeek, expireTime] = expiryFmt.split("T")
  const dowToOrd = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const dayOrd = dowToOrd.indexOf(expireDayOfWeek) + 1
  const [expiryHour, expiryMin, expirySec] = expireTime.split(":").map(val => parseInt(val, 10))
  return {
    expiryDay: dayOrd,
    expiryHour,
    expiryMin,
    expirySec
  }
}
