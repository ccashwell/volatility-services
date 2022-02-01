"use strict"
import { ServiceBroker } from "moleculer"
import WSService from "../../../services/ws.service"
import WebSocket from "ws"
import util from "util"
import { Service } from "aws-sdk"

describe("Test 'ws' service", () => {
  const service = new ServiceBroker({ logger: true })
  service.createService(WSService)

  beforeAll(() => service.start())
  afterAll(() => service.stop())

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

    test(
      "processes ws messages",
      async () => {
        const falsePromise = new Promise<boolean>((resolve, reject) => {
          console.log("*** FALSE PROMISE ")
        })

        ws.on("open", function open() {
          console.log("opening connection")

          const evidence = {
            version: "2022-01-1",
            type: "mfiv.14d.eth",
            context: {
              methodology: "mfiv",
              at: "2021-10-03T07:05:00Z",
              nearDate: "2022-01-28T08:00:00.000Z",
              nextDate: "2022-02-02T08:00:00.000Z",
              currency: "ETH",
              exchange: "deribit",
              windowInterval: "14d",
              instrument: "option",
              risklessRate: 0.0056,
              risklessRateAt: "2021-10-01T07:02:00.000Z",
              risklessRateSource: "aave"
            },
            params: {
              at: "2021-10-01T07:02:00.000Z",
              nearDate: "2021-10-08T08:00:00.000Z",
              nextDate: "2021-10-15T08:00:00.000Z",
              underlyingPrice: 3030.75,
              isBurnInPeriod: true,
              options: []
            },
            result: {
              dVol: 103.82139408011474,
              invdVol: 96.31926144512572,
              intermediates: {},
              value: "103.82139408011474",
              estimatedFor: "2021-10-01T07:02:00.000Z"
            }
          }

          // return service.emit("mfiv.14d.eth.index.created", evidence).then(() => {
          //   console.log("EMIT CALLED")
          //   return p
          // })

          return service.call("ws.announce", evidence).then(() => {
            console.log("SERVICE CALLED")
          })

          // const message = encoder.encode(
          //   JSON.stringify({
          //     //topic: "eth.mfiv.14d",
          //     topic: "ws/draw",
          //     data: { feed: "something" }
          //   })
          // )
          // ws.send(message)
          // console.log("Message Sent")
        })

        ws.on("message", message => {
          // debugger
          const buffer = message as ArrayBuffer
          const decoded = decoder.decode(buffer)
          console.log("received: %s", decoded)

          // let pong = service.settings.ws.keepAlive.pong

          // if (!(pong instanceof Uint8Array)) {
          //   service.settings.ws.keepAlive.pong = pong = new Uint8Array([pong])
          // }

          // if (Buffer.compare(message, pong) === 0) {
          //   return keepAlive(connectionContext, this.settings.ws.keepAlive)
          // }
          // const buffer = Buffer.from(message)
          // JSON.parse(decoder.decode(message.data))
          // ws.close()
        })

        ws.on("close", () => {
          console.log("closing")
          return Promise.resolve(true)
        })

        return falsePromise
        //await broker.call("ingest.process")
        //jest.useFakeTimers();
      },
      60 * 1000 * 5
    )
  })
})
