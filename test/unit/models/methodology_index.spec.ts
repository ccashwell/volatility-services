"use strict"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "../../../src/entities/methodology_index"

//#region Local Imports
import { MethodologyIndexRepository } from "../../../src/repositories"
// import connectionInstance from "../../../src/entities/connection"
import { IIndex } from "../../../src/interfaces/services/index"
import { getRepository } from "typeorm"
import { MethodologyIndex } from "../../../src/entities/methodology_index"

import { createConnection, Connection } from "typeorm"

// import MethodologyIndexInput from "../../../database/models/methodology_index"

import Connector from "../../config/connection"

describe("Test 'MethodologyIndex' model", () => {
  beforeAll(async () => await Connector())
  describe("save()", () => {
    // const repository = getCustomRepository(MethodologyIndexRepository)
    // const ctx = evidence.context
    // const index = repository.create()
    // index.timestamp = new Date(evidence.params.at)
    // index.value = evidence.result.dVol?.toString() ?? "undefined"
    // index.baseCurrency = ctx.currency as BaseCurrencyEnum
    // index.exchange = ctx.exchange as MethodologyExchangeEnum
    // index.methodology = ctx.methodology as MethodologyEnum
    // index.interval = ctx.windowInterval as MethodologyWindowEnum
    // index.symbolType = SymbolTypeEnum.Option
    // index.extra = extra
    // await repository.save(index)

    test("saves a new model", async () => {
      const indexRepository = getRepository(MethodologyIndex) // you can also get it via getConnection().getRepository() or getManager().getRepository()
      const index = indexRepository.create()

      index.timestamp = new Date()
      index.value = "42"
      index.baseCurrency = BaseCurrencyEnum.ETH
      index.exchange = MethodologyExchangeEnum.Deribit
      index.methodology = MethodologyEnum.MFIV
      index.interval = MethodologyWindowEnum.Day14
      index.symbolType = SymbolTypeEnum.Option
      index.extra = { requestId: "1234" }

      await indexRepository.save(index)
    })

    // const model = MethodologyIndexInput.build({
    //   baseCurrency: "ETH",
    //   exchange: "deribit",
    //   value: "0.123456789",
    //   methodology: "mfiv",
    //   symbolType: "option",
    //   timestamp: new Date(),
    //   interval: "14d",
    //   extra: {}
    // })
  })
})
