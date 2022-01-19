"use strict"
import { ServiceBroker } from "moleculer"
import TestService from "../../../services/ws.service"
import WebSocket from "ws"
import util from "util"

describe("Test 'ws' service", () => {
  const broker = new ServiceBroker({ logger: true })
  broker.createService(TestService)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("Websocket connect", () => {
    const ws = new WebSocket("ws://localhost:3000")
    ws.binaryType = "arraybuffer"

    const encoder = new util.TextEncoder()
    const decoder = new util.TextDecoder()

    // ws.onopen = () => {
    //   /* Join the "room" of canvas 1 */
    //   console.log("GOT onopen")
    // }

    // ws.onmessage = message => {
    //   console.log("GOT ONMESSAGE")
    //   console.log(message.data)
    //   //JSON.parse(decoder.decode(message.data))
    // }

    it("processes ws messages", done => {
      ws.on("open", function open() {
        console.log("opening connection")

        const message = encoder.encode(
          JSON.stringify({
            //topic: "eth.mfiv.14d",
            topic: "ws/draw",
            data: { feed: "something" }
          })
        )
        ws.send(message)
        console.log("Message Sent")
      })

      ws.on("message", function message(data) {
        console.log("received: %s", data)
        ws.close()
      })

      ws.on("close", () => {
        console.log("closing")
        done()
      })

      return Promise.resolve(true)
      //await broker.call("ingest.process")
      //jest.useFakeTimers();
    }, 30000)
  })
})
