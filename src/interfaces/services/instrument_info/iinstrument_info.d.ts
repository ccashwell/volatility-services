export interface InstrumentInfoParams {
  exchange: Exchange
  baseCurrency: BaseCurrency
  interval: MfivWindow
  type: "option"
  contractType: ContractType | ContractType[]
  timestamp: string
  expirationDates: string[]
}

export type InstrumentInfoResponse = string[]
