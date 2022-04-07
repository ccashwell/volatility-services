"use strict"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities"
import { IIndex } from "@interfaces/services/index"
import IndexService from "@services/index.service"
import { ServiceBroker } from "moleculer"

// jest.mock("@secrets", () => {
//   const originalModule = jest.requireActual("@secrets")

//   //Mock the default export and named export 'foo'
//   return {
//     __esModule: true,
//     ...originalModule,
//     default: jest.fn(() => {
//       return Promise.resolve({
//         FLEEK_ID: "mock-fleek-id",
//         FLEEK_SECRET: "mock-fleek-secret"
//       })
//     })
//   }
// })

describe("index.service api", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(IndexService) as IndexService
  // service.merged = (schema: { dependencies: any[] }) => {
  //   debugger
  //   schema.dependencies = []
  // }

  // Create a mock insert function
  // const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe(`estimate(params: MfivParams)`, () => {
    test("with valid parameters", () => {
      // service.actions.estimate = jest.fn()
      const params: IIndex.EstimateParams = {
        at: "2022-01-29T12:34:56Z",
        methodology: MethodologyEnum.MFIV,
        exchange: MethodologyExchangeEnum.Deribit,
        contractType: ["call_option", "put_option"],
        symbolType: SymbolTypeEnum.Option,
        timePeriod: MethodologyWindowEnum.Day14,
        asset: BaseCurrencyEnum.ETH,
        expiryType: MethodologyExpiryEnum.FridayT08
      }

      // IndexHelper.estimate
      expect.assertions(2)
      return broker
        .call("index.estimate", params)
        .then(result => {
          console.log("result", result)
          expect(result).toBeInstanceOf(Error)
          expect((result as Error).message).toContain("No index")
        })
        .catch(err => {
          console.error(err)
          expect(err).toBeInstanceOf(Error)
        })
    })

    test("with valid parameters and burn-in in progress", () => {
      // service.actions.estimate = jest.fn()
      const params: IIndex.EstimateParams = {
        at: "2022-01-29T12:34:56Z",
        methodology: MethodologyEnum.MFIV,
        exchange: MethodologyExchangeEnum.Deribit,
        contractType: ["call_option", "put_option"],
        symbolType: SymbolTypeEnum.Option,
        timePeriod: MethodologyWindowEnum.Day14,
        asset: BaseCurrencyEnum.ETH,
        expiryType: MethodologyExpiryEnum.FridayT08
      }

      expect.assertions(2)
      return service.waitForServices("index").then(v => {
        return broker
          .call<never, IIndex.EstimateParams>("index.estimate", params)
          .then(result => {
            console.log("result", result)
            expect(result).toBeInstanceOf(Error)
            expect((result as Error).message).toContain("No index")
          })
          .catch(err => {
            console.error(err)
            expect(err).toBeInstanceOf(Error)
          })
      })
    })
  })
})
