"use strict"
import { ServiceBroker, Errors } from "moleculer"
import RateService from "../../../services/rate.service"
import { IRate } from "../../../src/interfaces/services/rate"
import { risklessRateError } from "../../../lib/errors"
import { risklessRate } from "../../../src/service_helpers/rate_helper"

describe("rate.service api", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(RateService) as RateService
  const risklessRate = (params: IRate.RisklessRateParams) =>
    broker.call<never, IRate.RisklessRateParams>("rate.risklessRate", params)

  // Create a mock insert function
  // const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe(`risklessRate(params: IRate.RisklessRateParams)`, () => {
    test("with valid parameters", () => {
      // service.actions.estimate = jest.fn()
      const params: IRate.RisklessRateParams = {
        risklessRateSource: "aave"
      }

      return risklessRate(params).then(result => {
        return expect(result).toEqual(
          expect.objectContaining({
            risklessRate: expect.any(Number),
            risklessRateAt: expect.any(String),
            risklessRateSource: expect.stringMatching("aave")
          })
        )
      })
    })

    test("when there's a recoverable server error it returns a retryable error response", () => {
      // service.actions.estimate = jest.fn()
      const params: IRate.RisklessRateParams = {
        risklessRateSource: "aave"
      }
      const retryableError = new Errors.MoleculerRetryableError("A retryable error occurred", 500, "RETRYABLE")
      const error = risklessRateError(retryableError)
      service.fetchRisklessRate = jest.fn((params: IRate.RisklessRateParams) => {
        return Promise.reject(error)
      })

      expect.assertions(1)

      return risklessRate(params).catch(error => {
        return expect(error).toBeInstanceOf(Errors.MoleculerRetryableError)
      })
    })
  })

  test("when there's a client error it returns a non-retryable error response", () => {
    // service.actions.estimate = jest.fn()
    const params: IRate.RisklessRateParams = {
      risklessRateSource: "aave"
    }
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
