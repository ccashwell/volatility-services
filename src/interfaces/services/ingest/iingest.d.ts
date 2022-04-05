export interface OptionSummariesParams {
  expiry: string
  baseCurrency: "BTC" | "ETH"
}

export type OptionSummariesResponse = OptionSummary[]
