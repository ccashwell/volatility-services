export interface OptionSummariesParams {
  expiry: string
  asset: "BTC" | "ETH"
}

export type OptionSummariesResponse = OptionSummary[]
