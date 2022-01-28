import { getManager, EntityRepository, Repository } from "typeorm"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyIndex,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities/methodology_index"

@EntityRepository(MethodologyIndex)
export class MethodologyIndexRepository extends Repository<MethodologyIndex> {
  // async commit({
  //   timestamp,
  //   value,
  //   baseCurrency,
  //   exchange,
  //   methodology,
  //   interval,
  //   symbolType,
  //   extra
  // }: {
  //   timestamp: Date
  //   value: string
  //   baseCurrency: BaseCurrencyEnum
  //   exchange: MethodologyExchangeEnum
  //   methodology: MethodologyEnum
  //   interval: MethodologyWindowEnum
  //   symbolType: SymbolTypeEnum
  //   extra: Record<string, string>
  // }) {
  //   const model = new MethodologyIndex()
  //   model.timestamp = timestamp
  //   model.value = value
  //   model.baseCurrency = baseCurrency
  //   model.exchange = exchange
  //   model.methodology = methodology
  //   model.interval = interval
  //   model.symbolType = symbolType
  //   model.extra = extra
  //   return await getManager().save(model)
  // }
}
