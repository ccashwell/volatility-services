import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities"
import { ContractType } from "tardis-dev"

export interface EstimateParams {
  at: string
  methodology: MethodologyEnum
  interval: MethodologyWindowEnum
  baseCurrency: BaseCurrencyEnum
  exchange: MethodologyExchangeEnum
  symbolType: SymbolTypeEnum
  contractType: ContractType | ContractType[]
  expiryType: MethodologyExpiryEnum
}

export type EstimateResponse = MfivEvidence
