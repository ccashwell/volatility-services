import { IpfsClientConfig } from "./../../../src/clients/types"
;("use strict")
import { Errors, ServiceBroker } from "moleculer"
import mfivEvent from "../../fixtures/mfiv_event"
import IPFSService from "@services/ipfs.service"
import { IIPFS } from "@interfaces/services/ipfs"
import DefaultClient from "@clients/ipfs_client"
import { Bufferable } from "@datasources/types"

// jest.mock("@clients/ipfs_client", () => ({
//   DefaultClient: jest.fn((cfg: IpfsClientConfig) => jest.fn((key: string, buffer: Bufferable) => {}))
// }))
// jest.mock("@datasources/fleek", () => ({
//   provideIpfsClient: jest.fn((params: IIPFS.StoreParams) => {
//     const key = params.key
//     const response: FleekResponse = {
//       hash: `${key}-hash`,
//       hashV0: "",
//       key: key,
//       bucket: "volatilitycom-bucket",
//       publicUrl: `https://fleek.co/${key}`
//     } as FleekResponse

//     if (key.includes("retryable")) {
//       return Promise.reject(
//         new Errors.MoleculerRetryableError("a retryable error", 500, "SOME_ERROR", { details: ["Some details"] })
//       )
//     } else if (key.includes("throw")) {
//       return Promise.reject(new Error("Test threw an error"))
//     }
//     return Promise.resolve(response)
//   })
// }))

// jest.mock("@datasources/fleek", () => {
//   const originalModule = jest.requireActual("@datasources/fleek")
//   return {
//     __esModule: true,
//     ...originalModule,
//     default: jest.fn((params: IIPFS.StoreParams) => {
//       const key = params.key
//       const response: FleekResponse = {
//         hash: `${key}-hash`,
//         hashV0: "",
//         key: key,
//         bucket: "volatilitycom-bucket",
//         publicUrl: `https://fleek.co/${key}`
//       } as FleekResponse

//       if (key.includes("retryable")) {
//         return Promise.reject(
//           new Errors.MoleculerRetryableError("a retryable error", 500, "SOME_ERROR", { details: ["Some details"] })
//         )
//       } else if (key.includes("throw")) {
//         return Promise.reject(new Error("Test threw an error"))
//       }

//       return Promise.resolve(response)
//     })
//   }
// })

describe("ipfs.service", () => {
  const broker = new ServiceBroker({ logger: false })
  const service = broker.createService(IPFSService)
  const ipfsKey = "/some-random/ipfs/key.json"

  // service.store = jest.fn((context: Moleculer.Context<IIPFS.StoreParams, IIPFSServiceMeta>) => {
  //   const key = context.params.key
  //   const response: FleekResponse = {
  //     hash: `${key}-hash`,
  //     hashV0: "",
  //     key: key,
  //     bucket: "volatilitycom-bucket",
  //     publicUrl: `https://fleek.co/${key}`
  //   } as FleekResponse
  //   return ok(response)
  // })

  // Create a mock insert function
  // const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("store(params: IIPFS.StoreParams)", () => {
    const data = mfivEvent

    describe("with valid params", () => {
      const params = {
        key: "some-random/ipfs/filename.json",
        data: Buffer.from("payload"),
        metadata: { fileSize: 7, mimeType: "application/json", requestId: "some-transaction-id" }
      } as IIPFS.StoreParams

      test("responds with IIPFS.StoreResponse", () => {
        return service.broker.call("ipfs.store", params).then(response => {
          expect(response).toEqual(
            expect.objectContaining({
              key: "https://fleek.co/some-random/ipfs/filename.json",
              hash: "some-random/ipfs/filename.json-hash",
              metadata: {
                fileSize: 7,
                mimeType: "application/json",
                requestId: "some-transaction-id"
              }
            })
          )
        })
      })
    })

    describe("when fleek throws an error", () => {
      test("responds with IIPFS.StoreResponse", () => {
        const params = {
          key: "key-that-throws",
          data: Buffer.from("payload"),
          metadata: { fileSize: 7, mimeType: "application/json", requestId: "some-transaction-id" }
        } as IIPFS.StoreParams

        expect.assertions(1)

        return service.broker.call("ipfs.store", params).catch(error => {
          expect(error).toBeInstanceOf(Errors.MoleculerError)
        })
      })
    })

    describe("when fleek throws a retryable error", () => {
      it("returns a MoleculerRetryableError", () => {
        const params = {
          key: "key-that-throws-retryable",
          data: Buffer.from("payload"),
          metadata: { fileSize: 7, mimeType: "application/json", requestId: "some-transaction-id" }
        } as IIPFS.StoreParams

        expect.assertions(1)

        return service.broker.call("ipfs.store", params).catch(error => {
          expect(error).toBeInstanceOf(Errors.MoleculerRetryableError)
        })
      })
    })
  })
})
