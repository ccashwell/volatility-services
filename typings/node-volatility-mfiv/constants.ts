export const VERSIONS = ["2022-01-01"] as const

export const CURRENCIES = ["ETH"] as const

export const EXCHANGES = ["deribit"] as const

export const METHODOLOGIES = ["mfiv"] as const

export const MFIV_DURATIONS = ["14d"] as const

export const EVIDENCES = ["mfiv.estimate.evidence"] as const

export const SECOND_IN_MILLISECONDS = 1 * 1000
export const MINUTE_IN_MILLISECONDS = 60 * SECOND_IN_MILLISECONDS
export const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS
export const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS
export const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS
export const YEAR_IN_MILLISECONDS = 365 * DAY_IN_MILLISECONDS
