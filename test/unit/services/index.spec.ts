"use strict"
import { ServiceBroker } from "moleculer"
import IndexService from "../../../services/index.service"
import { IIndex } from "../../../src/interfaces/services/index"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "../../../src/entities"
import { EstimateParams } from "../../../src/interfaces/services/index/iindex"

jest.mock("../../../lib/utils/secrets", () => {
  const originalModule = jest.requireActual("../../../lib/utils/secrets")

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => {
      return Promise.resolve({
        FLEEK_ID: "mock-fleek-id",
        FLEEK_SECRET: "mock-fleek-secret"
      })
    })
  }
})

describe("index.service api", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(IndexService) as IndexService

  // Create a mock insert function
  // const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe(`estimate(params: MfivParams)`, () => {
    test("with valid parameters", () => {
      // service.actions.estimate = jest.fn()
      const params: EstimateParams = {
        at: "2022-01-29T12:34:56Z",
        methodology: MethodologyEnum.MFIV,
        exchange: MethodologyExchangeEnum.Deribit,
        contractType: ["call_option", "put_option"],
        symbolType: SymbolTypeEnum.Option,
        interval: MethodologyWindowEnum.Day14,
        baseCurrency: BaseCurrencyEnum.ETH,
        expiryType: MethodologyExpiryEnum.FridayT08
      }

      return broker
        .call<never, IIndex.EstimateParams>("index.estimate", params)
        .then(result => {
          console.log("result", result)
        })
        .catch(err => {
          expect(err).toBeInstanceOf(Error("No index"))
        })
    })

    test("with valid parameters and burn-in in progress", () => {
      // service.actions.estimate = jest.fn()
      const params: EstimateParams = {
        at: "2022-01-29T12:34:56Z",
        methodology: MethodologyEnum.MFIV,
        exchange: MethodologyExchangeEnum.Deribit,
        contractType: ["call_option", "put_option"],
        symbolType: SymbolTypeEnum.Option,
        interval: MethodologyWindowEnum.Day14,
        baseCurrency: BaseCurrencyEnum.ETH,
        expiryType: MethodologyExpiryEnum.FridayT08
      }

      expect.assertions(1)

      return broker
        .call<never, IIndex.EstimateParams>("index.estimate", params)
        .then(result => {
          debugger
          expect(result).toBeInstanceOf(new Error("No index"))
          console.log("result", result)
        })
        .catch(err => {
          expect(err).toBeInstanceOf(Error("No index"))
        })
    })
  })
})
