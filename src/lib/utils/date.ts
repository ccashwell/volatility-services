import dayjs from "dayjs"

const millisecondsRegex = /\.\d{3}?Z$/

export const toIsoNoMs = (date: Date) => date.toISOString().replace(millisecondsRegex, "Z")

/**
 *
 * @param date to convert to unix timestamp
 * @returns
 */
export const toUnixTimestamp = (date: Date) => dayjs(date).unix()
