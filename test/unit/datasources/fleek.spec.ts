"use strict"

import fleek from "@datasources/fleek"
import { uploadInput } from "@fleekhq/fleek-storage-js"
import { VGError } from "@lib/errors"

jest.mock("@datasources/fleek", () => {
  const originalModule = jest.requireActual("@datasources/fleek")
  const defaultMock = jest.fn((params: Omit<uploadInput, "apiKey" | "apiSecret">) =>
    Promise.resolve({
      hash: "ipfs-hash",
      hashV0: "ipfs-hashv0",
      key: "fleek-key",
      bucket: "fleek-bucket",
      publicUrl: "https://fleek.co/public-url"
    })
  )
  return {
    __esModule: true,
    default: defaultMock
  }
})

describe("Test 'fleek' client", () => {
  describe("with valid params", () => {
    const params = {
      key: "fleek-key",
      data: Buffer.from("buffer-of-data"),
      bucket: "fleek-bucket"
    }

    it("returns a successful response", async () => {
      return fleek(params).then(result => {
        expect(result).toEqual(
          expect.objectContaining({
            hash: "ipfs-hash",
            hashV0: "ipfs-hashv0",
            key: "fleek-key",
            bucket: "fleek-bucket",
            publicUrl: "https://fleek.co/public-url"
          })
        )
      })
    })
  })
  // describe("upload()", () => {
  //   debugger
  //   it("throws an error ", async () => {
  //     debugger
  //     const result = await fleek(params)
  //     expect(result).toEqual(
  //       expect.objectContaining({
  //         hash: "ipfs-hash",
  //         hashV0: "ipfs-hashv0",
  //         key: "fleek-key",
  //         bucket: "fleek-bucket",
  //         publicUrl: "https://fleek.co/public-url"
  //       })
  //     )
  //   })
  // })
})
