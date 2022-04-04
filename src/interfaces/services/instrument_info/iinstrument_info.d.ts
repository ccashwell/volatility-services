import { PartialInstrumentInfo } from "@lib/types"

export interface InstrumentInfoParams {
  exchange: Exchange
  baseCurrency: BaseCurrency
  interval?: MfivWindow
  type: "option"
  contractType: ContractType | ContractType[]
  timestamp?: string
  expirationDates: string[]
}

export type InstrumentInfoResponse = string[]

export interface RefreshParams {
  exchange: Exchange
  baseCurrency: BaseCurrency
  type: "option"
  contractType: ContractType | ContractType[]
}

export type RefreshResponse = PartialInstrumentInfo[]
