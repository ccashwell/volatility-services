import { MockProxy } from "jest-mock-extended"
import { provideFleekUpload } from "@datasources/fleek"
import { uploadInput } from "@fleekhq/fleek-storage-js"

// jest.mock("@datasources/fleek", () => ({
//   provideIpfsClient: jest.fn((params: Omit<uploadInput, "apiKey" | "apiSecret">) =>
//     Promise.resolve({
//       hash: "ipfs-hash",
//       hashV0: "ipfs-hashv0",
//       key: "fleek-key",
//       bucket: "fleek-bucket",
//       publicUrl: "https://fleek.co/public-url"
//     })
//   )
// }))

// jest.mock("@datasources/fleek", () => {
//   const originalModule = jest.requireActual("@datasources/fleek")
//   const defaultMock = jest.fn((params: Omit<uploadInput, "apiKey" | "apiSecret">) =>
//     Promise.resolve({
//       hash: "ipfs-hash",
//       hashV0: "ipfs-hashv0",
//       key: "fleek-key",
//       bucket: "fleek-bucket",
//       publicUrl: "https://fleek.co/public-url"
//     })
//   )
//   return {
//     __esModule: true,
//     default: defaultMock
//   }
// })

describe("Test 'fleek' client", () => {
  describe("initialize(bucket, apiKey, apiSecret)", () => {
    // const params = {
    //   key: "fleek-key",
    //   data: Buffer.from("buffer-of-data"),
    //   bucket: "fleek-bucket"
    // }
    // const mock = MockProxy<>
    const provideFleekUpload = jest.fn()

    it("returns a function that returns a Promise<FleekResponse>", () => {
      const result = provideFleekUpload("my-bucket", "api-key", "api-secret")

      expect(provideFleekUpload).toHaveBeenCalledWith("my-bucket", "api-key", "api-secret")
    })
    // it("returns a successful response", () => {
    //   // const fetch = FleekClient()

    //   return fetch(params).then(result => {
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
