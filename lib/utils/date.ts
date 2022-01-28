const millisecondsRegex = /\.\d{3}?Z$/

export const toIsoNoMs = (date: Date) => date.toISOString().replace(millisecondsRegex, "Z")
