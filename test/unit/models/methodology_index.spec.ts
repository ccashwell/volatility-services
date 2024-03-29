"use strict"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  SymbolTypeEnum
} from "@entities"
import { MethodologyIndex } from "@entities/methodology_index"
import { DeepPartial, getRepository, QueryFailedError } from "typeorm"

describe("Test 'MethodologyIndex' model", () => {
  // beforeAll(async () => await connectionInstance())
  // afterAll(() => getConnection().close())

  describe("when creating with valid params", () => {
    const params = {
      timestamp: new Date(),
      value: "42",
      asset: BaseCurrencyEnum.ETH,
      exchange: MethodologyExchangeEnum.Deribit,
      methodology: MethodologyEnum.MFIV,
      timePeriod: '14D',
      symbolType: SymbolTypeEnum.Option,
      extra: { requestId: "1234" }
    }

    it("saves successfully", () => {
      const indexRepository = getRepository<MethodologyIndex>(MethodologyIndex) // you can also get it via getConnection().getRepository() or getManager().getRepository()
      const index = indexRepository.create(params as DeepPartial<MethodologyIndex>)
      return expect(indexRepository.save(index)).resolves.toBeInstanceOf(MethodologyIndex)
    })
  })

  describe("when creating with invalid params", () => {
    const params = {
      exchange: MethodologyExchangeEnum.Deribit
    }

    it("returns a rejected promise", () => {
      const indexRepository = getRepository<MethodologyIndex>(MethodologyIndex) // you can also get it via getConnection().getRepository() or getManager().getRepository()
      const index = indexRepository.create(params as DeepPartial<MethodologyIndex>)
      return expect(indexRepository.save(index)).rejects.toBeInstanceOf(QueryFailedError)
    })
  })
})
