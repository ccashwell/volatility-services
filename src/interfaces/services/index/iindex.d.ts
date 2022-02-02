import { ContractType } from "tardis-dev"
import {
  MethodologyEnum,
  MethodologyWindowEnum,
  BaseCurrencyEnum,
  MethodologyExchangeEnum,
  SymbolTypeEnum,
  MethodologyExpiryEnum
} from "@entities"

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
