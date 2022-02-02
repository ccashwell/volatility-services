"use strict"
import { ServiceBroker } from "moleculer"
import WSService from "../../../services/ws.service"
import WebSocket from "ws"
import util from "util"
import { Service } from "aws-sdk"

describe("ws.service", () => {
  const service = new ServiceBroker({ logger: true })
  service.createService(WSService)

  beforeAll(() => service.start())
  afterAll(() => service.stop())

  describe("subscribing to 'mfiv.14d.eth'", () => {
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

    it("receives an mfiv result", () => {
      expect.assertions(1)

      return new Promise<void>((resolve, reject) => {
        ws.on("open", () => {
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

          return service.call("ws.announce", evidence)
        })

        ws.on("message", message => {
          // debugger
          const buffer = message as ArrayBuffer
          const index = JSON.parse(decoder.decode(buffer))

          console.log("received: %j", index)

          // eslint-disable-next-line no-debugger
          //debugger

          //  {"type":"mfiv.14d.eth","at":"2021-10-01T07:02:00.000Z","dVol":103.82139408011474,"invdVol":96.31926144512572,"value":"103.82139408011474"}
          expect(index).toEqual(
            expect.objectContaining({
              type: "mfiv.14d.eth",
              at: expect.any(String),
              dVol: expect.any(Number),
              invdVol: expect.any(Number),
              value: expect.any(String)
            })
          )

          ws.close()
        })

        ws.on("close", () => {
          return resolve()
        }).
      })
    }, 5000)
  })
})
