/* eslint-disable camelcase */
"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import ApiGateway from "moleculer-web-uws"
import { MfivEvidence, OptionSummary } from "node-volatility-mfiv"
import { TextEncoder } from "util"
import { DISABLED, WebSocket } from "uWebSockets.js"
import { streamNormalizedWS } from "../src/ws/stream"

/**
 * Compute index values from data produced by the ingest service
 */
export default class WSService extends Service {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  readonly wsRoutes = {
    "/ws-stream-normalized": streamNormalizedWS
  } as any

  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "ws",
      mixins: [ApiGateway],
      settings: {
        encoder: new TextEncoder(),

        ws: {
          path: "/ws",

          compression: DISABLED,

          maxPayloadLength: 16 * 1024,

          idleTimeout: 24 * 60 * 60,

          maxBackpressure: 5 * 1024 * 1024,

          closeOnBackpressureLimit: true,

          keepAlive: {
            // Amount of seconds after which a PING message is sent to the client
            interval: 5000,

            // The message to be sent as a PING to the WebSocket client.
            // Can be any value, as long as the client will be able to identify it as a PING control message
            // from the server.
            ping: new Uint8Array([57]),

            // The message to be received from the WebSocket client as a PONG control message.
            // Can be a Uint8Array or integer(Will be converted to TypedArray)
            pong: new Uint8Array([65])
          },

          // upgrade: (res: HttpResponse, req: HttpRequest, context: us_socket_context_t) => {
          //   this.logger.info("upgrade")

          //   res.upgrade(
          //     { req },
          //     req.getHeader("sec-websocket-key"),
          //     req.getHeader("sec-websocket-protocol"),
          //     req.getHeader("sec-websocket-extensions"),
          //     context
          //   )
          // },

          open: (ws: WebSocket) => {
            this.logger.info("Opening")
            // eslint-disable-next-line no-debugger
            debugger

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const path = ws.req.getUrl().toLocaleLowerCase() as string

            console.log(`Opening path ${path}`)

            ws.closed = false
            const matchingRoute = this.wsRoutes[path]

            if (matchingRoute !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              matchingRoute(ws, ws.req)
            } else {
              ws.end(1008)
            }
          },

          message: (ws: WebSocket, message: ArrayBuffer) => {
            this.logger.info("Message")

            if (ws.onmessage !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              ws.onmessage(message)
            }
          },

          close: (ws: WebSocket) => {
            this.logger.info("Close")

            ws.closed = true
            if (ws.onclose !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              ws.onclose()
            }
          }

          // open: (socket: uWS.WebSocket) => {
          //   // eslint-disable-next-line no-debugger
          //   // wsList.push(socket)
          //   // socket.subscribe("mfiv.14d.eth.expiry")
          //   //            wsList.push(socket)
          //   socket.subscribe("mfiv/expiry")
          //   socket.subscribe("mfiv/14d/eth")
          // },

          // message: (
          //   app: { publish: (topic: string, data: any) => void },
          //   socket: { publish: (topic: string, data: unknown) => void },
          //   message: any,
          //   isBinary: boolean,
          //   topic: string
          // ) => {
          //   console.info("ws message received", message)
          //   // eslint-disable-next-line no-debugger
          //   socket.publish("mfiv/expiry", message)
          //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          // },

          // close: (ws: uWS.WebSocket, code: number, message: ArrayBuffer) => {
          //   console.info("CLOSING SOCKET")
          //   // wsList.shift()
          // }
        }
      },
      actions: {
        hello: {
          rest: "GET /hello",

          handler(ctx: Context<void>) {
            return "World!"
          }
        },

        health: {
          rest: "GET /health",

          handler(ctx: Context<void>) {
            return ctx.call("$node.health")
          }
        },

        announce: {
          ws: {
            // topic: "eth.mfiv.14d.expiry",

            publish: true,

            send: false,
            // If defined and is a callback, a client will only be subscribed to the topic if the callback returns true.
            // Optional
            condition: true // Should return a truthy result
          },

          port: 3000,

          handler(context: Context<OptionSummary>) {
            const message = context.params

            throw new Error("Shouldn't be here")
            // if (wsList.length > 0) {
            //   console.log("topics", wsList[0].getTopics())
            //   wsList[0].publish("mfiv/expiry", JSON.stringify(message))
            // }
            return message
            // wsList[0].publish("mfiv/expiry", JSON.stringify(message))
            // const decoder = new TextDecoder()
            // const index = JSON.parse(decoder.decode(message)) as Record<string, unknown>

            //            const decoded = decoder.decode(message as Buffer)
            // const encoder = new TextEncoder()

            // this.logger.info("Received Message", message)

            // const result = context.params.result
            // const { dVol, invdVol, currency, value } = result

            // const index = {
            //   type: context.params.type,
            //   at: context.params.params.at,
            //   dVol,
            //   invdVol,
            //   currency,
            //   value
            // }

            // /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

            return message
            // ts-config ignore
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

            // const connectionContext = ctx.meta.c_ctx
            // Do something with the message and return the results(Optional)
          }
        }
      },

      events: {
        "mfiv.14d.eth.expiry": {
          handler(context: Context<OptionSummary>) {
            // await this.actions.announce(context.params)
            const payload = { topic: "mfiv/expiry", data: context.params }
            const message = (this.settings.encoder as TextEncoder).encode(JSON.stringify(payload))

            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            this.server.publish("mfiv/expiry", message, false)
            // wsList.forEach(ws => {
            //   if (ws.isSubscribed("mfiv/expiry") || ws.) {
            //     const message = (this.settings.encoder as TextEncoder).encode(JSON.stringify(context.params))
            //     ws.send(message, false, false)
            //   }
            // })
            //   ws.publish("mfiv/expiry", JSON.stringify(context.params))
            // })
            // const encoder = new TextEncoder()
            // const message = encoder.encode(
            //   JSON.stringify({
            //     topic: "mfiv.14d.eth.expiry",
            //     data: context.params
            //   })
            // )
            // uWS.
            // await (this as ApiGateway).server.publish("mfiv/expiry", context.params, false, false)
            // uWS.publish
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // await this.server.publish("mfiv.14d.eth.expiry", message, true, false)
            // await this.actions.announce(context.params)
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            //await this.server.publish("mfiv.14d.eth.expiry", message, true, false)
          }
        },
        "mfiv.14d.ETH.index.created": {
          async handler(this: WSService, context: Context<MfivEvidence>) {
            const result = context.params.result
            const { dVol, invdVol, currency, value } = result
            const index = {
              type: context.params.type,
              at: context.params.params.at,
              dVol,
              invdVol,
              currency,
              value
            }
            const payload = { topic: "mfiv/14d/eth", data: index }
            const message = (this.settings.encoder as TextEncoder).encode(JSON.stringify(payload))
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            await this.server.publish("mfiv/14d/eth", message, false)
          }
        }
      },

      started(this: WSService) {
        this.logger.info("*** STARTED ***")
        return Promise.resolve()
      }
    })
  }
}
