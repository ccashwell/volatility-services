"use strict"

import aave from "../../../src/datasources/aave"

describe("aave client", () => {
  describe("getReserveData()", () => {
    test("with AAVE LendingPoolV2 address", () => {
      return aave().then(result => {
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          debugger
          const value = result.value
          console.log(value)

          expect(result.value).toEqual(
            expect.objectContaining({
              status: "1",
              message: "OK",
              result: expect.any(String)
            })
          )
        }
      })
    })
  })
})
