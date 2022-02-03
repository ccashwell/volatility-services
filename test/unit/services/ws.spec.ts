"use strict"
import { ServiceBroker } from "moleculer"
import WSService from "../../../services/ws.service"
import WebSocket from "ws"
import util from "util"
import evidence from "../../fixtures/evidence"

describe.skip("ws.service", () => {
  const service = new ServiceBroker({ logger: true })
  service.createService(WSService)

  beforeAll(() => service.start())
  afterAll(() => service.stop())

  describe("subscribing to 'mfiv.14d.eth'", () => {
    const ws = new WebSocket("ws://localhost:3000")
    ws.binaryType = "arraybuffer"

    const encoder = new util.TextEncoder()
    const decoder = new util.TextDecoder()

    ws.onmessage = message => {
      console.log("GOT ONMESSAGE")
      console.log(message.data)
      //JSON.parse(decoder.decode(message.data))
    }

    it("receives an mfiv result", async () => {
      // expect.assertions(1)

      return new Promise<unknown>((resolve, reject) => {
        ws.on("open", () => {
          return service.call("ws.announce", evidence)
        }).on("message", message => {
          const buffer = message as ArrayBuffer
          const index = JSON.parse(decoder.decode(buffer))

          console.log("received: %j", index)

          ws.close()
          return resolve(index)
        })
      }).then(index => {
        return expect(index).toEqual(
          expect.objectContaining({
            type: "mfiv.14d.eth",
            at: expect.any(String),
            dVol: expect.any(Number),
            invdVol: expect.any(Number),
            value: expect.any(String)
          })
        )
      })
    }, 5000)
  })
})
