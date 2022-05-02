import { BaseCurrency, ContractType, PartialInstrumentInfo } from "@lib/types"
import { Exchange } from "tardis-dev"

export interface InstrumentInfoParams {
  exchange: Exchange
  asset: Asset
  timePeriod?: TimePeriod
  type: "option"
  contractType: ContractType | ContractType[]
  timestamp?: string
  expirationDates: string[]
  active?: boolean
}

export type InstrumentInfoResponse = string[]

export interface RefreshParams {
  exchange: Exchange
  asset: BaseCurrency
  type: "option"
  contractType: ContractType | ContractType[]
}

export type RefreshResponse = PartialInstrumentInfo[]

export interface AvailableParams {
  exchange: Exchange
  asset: BaseCurrency
  active: boolean
}

export type AvailableResponse = string[]
