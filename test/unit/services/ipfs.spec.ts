"use strict"
import Moleculer, { ServiceBroker } from "moleculer"
import { ok } from "neverthrow"
import mfivEvent from "../../fixtures/mfiv_event"
import IPFSService from "../../../services/ipfs.service"
import { IIPFS } from "../../../src/interfaces/services/ipfs"
import { FleekResponse } from "../../../src/datasources"
import { IIPFSServiceMeta } from "../../../src/interfaces/meta"

describe("ipfs.service", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(IPFSService)
  const ipfsKey = "/some-random/ipfs/key.json"
  // const eventName = "ipfs.mfiv.estimate"

  service.operation = jest.fn(() => {
    return {
      store: (context: Moleculer.Context<IIPFS.StoreParams, IIPFSServiceMeta>) => {
        const key = context.params.key
        const response: FleekResponse = {
          hash: `${key}-hash`,
          hashV0: "",
          key: key,
          bucket: "volatilitycom-bucket",
          publicUrl: `https://fleek.co/${key}`
        } as FleekResponse
        return ok(response)
      }
    }
  })

  // Create a mock insert function
  // const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  // describe(`Event "${eventName}"`, () => {
  describe("store(params: IIPFS.StoreParams)", () => {
    const data = mfivEvent

    // test("calls upload() handler", async () => {
    //   service.upload = jest.fn()
    //   await service.emitLocalEventHandler(eventName, data)
    //   expect(service.upload).toBeCalledTimes(1)
    //   expect(service.upload).toBeCalledWith({ params: data, requestId: "no-ackID" })
    // })

    test("writes data to IPFS", async () => {
      const params = {
        key: ipfsKey,
        data: Buffer.from("payload"),
        metadata: { fileSize: 7, mimeType: "application/json", requestId: "some-transaction-id" }
      } as IIPFS.StoreParams
      const response = await service.broker.call("ipfs.store", params)
      expect(response).toEqual(
        expect.objectContaining({
          key: "/some-random/ipfs/key.json",
          hash: "/some-random/ipfs/key.json-hash"
        })
      )
    })
  })
})
