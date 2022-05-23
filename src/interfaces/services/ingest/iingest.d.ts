import { Asset } from "node-volatility-mfiv"

export interface OptionSummariesParams {
  expiry: string
  asset: Asset
}

export type OptionSummariesResponse = OptionSummary[]
