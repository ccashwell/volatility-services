import { ContractType, Exchange, getInstrumentInfo, SymbolType } from "tardis-dev"

export interface TardisInstrumentInfoFilter {
  exchange: Exchange
  baseCurrency?: string | string[]
  quoteCurrency?: string | string[]
  type?: SymbolType | SymbolType[]
  contractType?: ContractType | ContractType[]
  active?: boolean
}

export const tardisOptionInstrumentDataSource = async ({
  exchange,
  baseCurrency,
  quoteCurrency = undefined,
  active = undefined,
  contractType,
  type
}: TardisInstrumentInfoFilter) => {
  console.log("getInstrumentInfo", { exchange, baseCurrency, quoteCurrency, active, contractType, type })
  return await getInstrumentInfo(exchange, {
    baseCurrency,
    quoteCurrency,
    active,
    contractType,
    type
  })
}
