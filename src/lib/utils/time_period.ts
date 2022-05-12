/**
 * Convert a `time-period` formatted string to integer in days
 *
 * @param timePeriod a string representation in days (e.g. '14D')
 * @returns number of days
 */
export const timePeriodToInteger = (timePeriod: string) => {
  const end = timePeriod.indexOf("D")
  if (end === -1 || end === 0) {
    throw new Error('Expected timePeriod to be of the format "<number>D"')
  }
  const val = +timePeriod.slice(0, end)
  if (val === 0) {
    throw new Error("Expected timePeriod to be > 0")
  }

  return val
}
