import { MethodologyExpiryEnum } from "@entities"
import C from "./constants"

export const mfivDates = (now: Date, timePeriod: string, expiryType = MethodologyExpiryEnum.FridayT08) => {
  // TODO: Remove guard once we need to support other time ranges.
  if (timePeriod !== "14d") {
    throw Error(`An time period of ${timePeriod} is not allowed. Only '14d' is currently supported.`)
  }

  const nextExpirationDate = nextExpiration(now.valueOf(), timePeriod, expiryType)
  const nearExpirationDate = new Date(nextExpirationDate.valueOf() - 7 * C.MILLISECONDS_PER_DAY)
  const rollover = new Date(nextExpirationDate.valueOf() - 14 * C.MILLISECONDS_PER_DAY)

  return {
    nearExpiration: nearExpirationDate.toISOString(),
    nextExpiration: nextExpirationDate.toISOString(),
    rollover: rollover.toISOString()
  }
}

const nextExpiration = (dateMs: number, timePeriod: string, expiryType: string) => {
  const expiryMatch = expiryTypeToOrdinals(expiryType)
  const targetDate = new Date(dateMs + C.MILLISECONDS_PER_DAY * parseInt(timePeriod, 10))
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
