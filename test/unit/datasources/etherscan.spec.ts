"use strict"

import etherscan from "../../../src/datasources/etherscan"

describe("etherscan client", () => {
  describe("abi(address: string)", () => {
    const aaveLendingPoolV2 = "0xc6845a5c768bf8d7681249f8927877efda425baf"

    test("with AAVE LendingPoolV2 address", () => {
      return etherscan(aaveLendingPoolV2).then(result => {
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
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
