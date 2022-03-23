"use strict"
import { IRate } from "@interfaces/services/rate"
import { risklessRateError } from "@lib/errors"
import RateService from "@services/rate.service"
import { Errors, ServiceBroker } from "moleculer"

// const mockAave = (response: IRate.RisklessRateParams) => {
//   jest.mock("@datasources/aave", () => {
//     const originalModule = jest.requireActual("@datasources/aave")
//     let defaultMock = jest.fn(() => response)
//     return {
//       __esModule: true,
//       ...originalModule,
//       provideRateResponse: defaultMock,
//       default: defaultMock,
//       secrets: defaultMock
//     }
//   })
// }

describe("rate.service api", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(RateService)
  const risklessRate = (params: IRate.RisklessRateParams) =>
    broker.call<never, IRate.RisklessRateParams>("rate.risklessRate", params)
  const params: IRate.RisklessRateParams = {
    risklessRateSource: "AAVE"
  }

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe(`risklessRate(params: IRate.RisklessRateParams)`, () => {
    test("with valid parameters", () => {
      const response: IRate.RisklessRateResponse & { contractValue: number } = {
        contractValue: 85583973859841772736137,
        risklessRate: 100.0 * (85583973859841772736137 / 10 ** 27), // 0.008558397385984177
        risklessRateAt: new Date().toISOString(),
        risklessRateSource: "AAVE"
      }

      service.fetchRisklessRate = jest.fn((params: IRate.RisklessRateParams) => Promise.resolve(response))

      expect.assertions(1)
      return risklessRate(params).then(result => {
        expect(result).toEqual(
          expect.objectContaining({
            risklessRate: expect.any(Number),
            risklessRateAt: expect.any(String),
            risklessRateSource: expect.stringMatching("AAVE")
          })
        )
      })
    })

    test("when there's a recoverable server error it returns a retryable error response", () => {
      const retryableError = new Errors.MoleculerRetryableError("A retryable error occurred", 500, "RETRYABLE")
      service.fetchRisklessRate = jest.fn((params: IRate.RisklessRateParams) => {
        return Promise.reject(retryableError)
      })

      expect.assertions(1)
      return risklessRate(params).catch(error => {
        expect(error).toBeInstanceOf(Errors.MoleculerRetryableError)
      })
    })
  })

  test("when there's a client error it returns a non-retryable error response", () => {
    const nonRetryableError = new Errors.MoleculerClientError("A non-retryable error occurred", 500, "NONRETRYABLE")
    const error = risklessRateError(nonRetryableError)
    service.fetchRisklessRate = jest.fn((params: IRate.RisklessRateParams) => {
      return Promise.reject(error)
    })

    expect.assertions(1)

    return risklessRate(params).catch(error => {
      return expect(error).toBeInstanceOf(Errors.MoleculerError)
    })
  })
})
