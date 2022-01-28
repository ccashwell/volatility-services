"use strict"
import { ServiceBroker } from "moleculer"
import { ok } from "neverthrow"
import { FleekResponse } from "../../../datasources/fleek"
import TestService from "../../../services/ipfs.service"
import mfivEvent from "../../fixtures/mfiv_event"
import defaultExport from "../../../lib/utils/secrets"
import IPFSService from "../../../services/ipfs.service"

jest.mock("../../../lib/utils/secrets", () => {
  const originalModule = jest.requireActual("../../../lib/utils/secrets")

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => {
      return Promise.resolve({
        FLEEK_ID: "mock-fleek-id",
        FLEEK_SECRET: "mock-fleek-secret"
      })
    })
  }
})

describe("Test 'ipfs' service", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(IPFSService)
  const eventName = "ipfs.mfiv.estimate"

  // Create a mock insert function
  const mockUpload = jest.fn(({ params, requestId }) => Promise.resolve({ hash: "mfiv-ipfs-hash" }))
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe(`Event "${eventName}"`, () => {
    const data = mfivEvent

    // test("calls upload() handler", async () => {
    //   service.upload = jest.fn()
    //   await service.emitLocalEventHandler(eventName, data)
    //   expect(service.upload).toBeCalledTimes(1)
    //   expect(service.upload).toBeCalledWith({ params: data, requestId: "no-ackID" })
    // })

    test("writes data to IPFS", async () => {
      const key =
        "/indices/methodology=mfiv/interval=14d/currency=ETH/exchange=deribit/instrument=option/ts=2021-10-01T07:02:00.000Z/evidence.json"
      service.writeIPFS = jest.fn(async (key: string, data: Buffer) => {
        const response: FleekResponse = {
          hash: `${key}-hash`,
          hashV0: "",
          key: key,
          bucket: "volatilitycom-bucket",
          publicUrl: `https://fleek.co/${key}`
        } as FleekResponse
        return ok(response)
      })

      await service.emitLocalEventHandler(eventName, data)
      expect(service.writeIPFS).toBeCalledTimes(1)
      expect(service.writeIPFS).toBeCalledWith(key, Buffer.from(JSON.stringify(data)))
    })
  })
})
