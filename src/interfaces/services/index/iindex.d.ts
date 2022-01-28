import {
  MethodologyEnum,
  MethodologyWindowEnum,
  BaseCurrencyEnum,
  MethodologyExchangeEnum,
  SymbolTypeEnum,
  MethodologyExpiryEnum
} from "@entities/methodology_index"

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
