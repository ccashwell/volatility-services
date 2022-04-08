import dayjs from "dayjs"

const millisecondsRegex = /\.\d{3}?Z$/

export const toIsoNoMs = (date: Date) => date.toISOString().replace(millisecondsRegex, "Z")

/**
 * Given a date object return the unix timestamp in seconds
 *
 * @param date to convert to unix timestamp
 * @returns integer in seconds
 */
export const toUnixTimestamp = (date: Date | string) => dayjs(date).unix()
