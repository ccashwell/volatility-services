import { PartialInstrumentInfo } from "@lib/types"

export interface InstrumentInfoParams {
  exchange: Exchange
  asset: BaseCurrency
  timePeriod?: MfivWindow
  type: "option"
  contractType: ContractType | ContractType[]
  timestamp?: string
  expirationDates: string[]
}

export type InstrumentInfoResponse = string[]

export interface RefreshParams {
  exchange: Exchange
  asset: BaseCurrency
  type: "option"
  contractType: ContractType | ContractType[]
}

export type RefreshResponse = PartialInstrumentInfo[]
