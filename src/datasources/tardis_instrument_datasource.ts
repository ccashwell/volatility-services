import { Exchange, SymbolType, ContractType, getInstrumentInfo } from "tardis-dev"

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
  active = true,
  contractType,
  type
}: TardisInstrumentInfoFilter) =>
  await getInstrumentInfo(exchange, {
    baseCurrency,
    quoteCurrency,
    active,
    contractType,
    type
  })
