"use strict"

import { ok } from "neverthrow"
import aave from "@datasources/aave"
import { IRate } from "@interfaces/services/rate"

jest.mock("@datasources/aave", () => {
  const originalModule = jest.requireActual("@datasources/aave")
  const defaultMock = jest.fn((address: string) =>
    Promise.resolve({
      contractValue: 123456789,
      risklessRate: 0.0055, // TODO: Return 'undefined' and let upstream handle it
      risklessRateAt: new Date().toISOString(),
      risklessRateSource: "aave"
    } as IRate.RisklessRateResponse & { contractValue: number })
  )
  return {
    __esModule: true,
    default: defaultMock
  }
})

describe("aave client", () => {
  describe("getReserveData()", () => {
    test("with AAVE LendingPoolV2 address", () => {
      return aave().then(result => {
        expect(result).toEqual(
          expect.objectContaining({
            contractValue: 123456789,
            risklessRate: 0.0055,
            risklessRateAt: expect.any(String),
            risklessRateSource: expect.stringMatching("aave")
          })
        )
      })
    })
  })
})
