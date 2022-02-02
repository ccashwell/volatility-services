"use strict"
import { TextEncoder } from "util"
import { Context, Service, ServiceBroker } from "moleculer"
import ApiGateway from "moleculer-web-uws"
import { MfivEvidence } from "node-volatility-mfiv"

/**
 * Compute index values from data produced by the ingest service
 */
export default class WSService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "ws",
      mixins: [ApiGateway],
      settings: {
        ws: {
          path: "/*",

          compression: 0,

          idleTimeout: 0,

          maxBackPressure: 1024 * 1024,

          maxPayloadLength: 16 * 1024,

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

          // upgrade: (res, req, context) => {},

          open: (socket: { subscribe: (arg0: string) => void }) => {
            console.info("subscribing to mfiv.14d.eth")
            socket.subscribe("mfiv.14d.eth")
          },

          message: (
            app: { publish: (topic: string, data: any) => void },
            socket: { publish: (topic: string, data: unknown) => void },
            message: any,
            isBinary: boolean,
            topic: string
          ) => {
            console.info("ws message received", message)
            // eslint-disable-next-line no-debugger
            debugger
            socket.publish("mfiv.14d.eth", message)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          }
        }
      },
      actions: {
        announce: {
          ws: {
            topic: "eth.mfiv.14d",

            publish: true,

            send: true,
            // If defined and is a callback, a client will only be subscribed to the topic if the callback returns true.
            // Optional
            condition: true // Should return a truthy result
          },

          port: 3000,

          handler(context: Context<MfivEvidence>) {
            const message = context.params
            const encoder = new TextEncoder()

            this.logger.info("Received Message", message)

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

            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

            return index
            // ts-config ignore
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

            // const connectionContext = ctx.meta.c_ctx
            // Do something with the message and return the results(Optional)
          }
        }
      },

      events: {
        "mfiv.14d.eth.index.created": {
          async handler(this: WSService, context: Context<MfivEvidence>) {
            // eslint-disable-next-line no-debugger
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
            const encoder = new TextEncoder()
            const message = encoder.encode(
              JSON.stringify({
                topic: "mfiv.14d.eth",
                data: index
              })
            )

            console.log("Publishing message")
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            await this.server.publish("mfiv.14d.eth", message, true, false)
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
