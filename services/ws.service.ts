/* eslint-disable camelcase */
import { Context, Service, ServiceBroker } from "moleculer"
import ApiGateway, { HttpResponse, us_socket_context_t } from "moleculer-web-uws"
import { MfivEvidence, OptionSummary } from "node-volatility-mfiv"
import { TextDecoder, TextEncoder } from "util"
import { DISABLED, WebSocket } from "uWebSockets.js"
import { streamNormalizedWS } from "../src/ws/stream"

const MESSAGE_ENUM = Object.freeze({
  SELF_CONNECTED: "SELF_CONNECTED",
  CLIENT_CONNECTED: "CLIENT_CONNECTED",
  CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
  CLIENT_MESSAGE: "CLIENT_MESSAGE"
})

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
      mixins: [
        ApiGateway
        // Passport
        // PassportMixin({
        //   routePath: "/auth",
        //   localAuthAlias: "v1.accounts.login",
        //   successRedirect: "/",
        //   providers: {
        //     google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
        //     facebook: process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
        //     github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
        //     twitter: false
        //   }
        // })
      ],
      settings: {
        encoder: new TextEncoder(),

        ws: {
          path: "/ws",

          compression: DISABLED,

          maxPayloadLength: 16 * 1024,

          idleTimeout: 60,

          maxBackpressure: 5 * 1024 * 1024,

          closeOnBackpressureLimit: true,

          // keepAlive: {
          //   // Amount of seconds after which a PING message is sent to the client
          //   interval: 5000,
          //   // The message to be sent as a PING to the WebSocket client.
          //   // Can be any value, as long as the client will be able to identify it as a PING control message
          //   // from the server.
          //   ping: new Uint8Array([57]),
          //   // The message to be received from the WebSocket client as a PONG control message.
          //   // Can be a Uint8Array or integer(Will be converted to TypedArray)
          //   pong: new Uint8Array([65])
          // },

          upgrade: async (res: HttpResponse, req: unknown /*HttpRequest*/, context: us_socket_context_t) => {
            this.logger.info("upgrade")

            let authHeader = ""
            let reqWithHeaders: { headers: Record<string, string> }

            try {
              reqWithHeaders = req as { headers: Record<string, string> }
              authHeader = reqWithHeaders.headers.authorization
            } catch (err) {
              this.logger.error("error:", err)
              throw err
            }

            let authToken = ""

            console.info("authHeader", authHeader)
            if (authHeader && authHeader.startsWith("Bearer ")) {
              authToken = authHeader.slice("Bearer ".length)
            }
            console.info("authTOken", authToken)

            const tokenCheck = await this.broker.call("tokens.check", {
              token: authToken,
              type: "api-key"
            })

            console.info("tokenCheck", tokenCheck)
            if (!tokenCheck) {
              return res.writeStatus("401 Forbidden")
            }

            // const reqHttp = req as HttpRequest
            // res.upgrade(
            //   { req },
            //   reqHttp.getHeader("sec-websocket-key"),
            //   reqHttp.getHeader("sec-websocket-protocol"),
            //   reqHttp.getHeader("sec-websocket-extensions"),
            //   context
            // )
          },

          open: (ws: WebSocket) => {
            // Upon connecting, subscribe the socket to MFIV/14D/ETH
            ws.subscribe("MFIV/14D/ETH")
            ws.subscribe(MESSAGE_ENUM.CLIENT_CONNECTED)
            ws.subscribe(MESSAGE_ENUM.CLIENT_DISCONNECTED)
            ws.subscribe(MESSAGE_ENUM.CLIENT_MESSAGE)

            ws.id = this.broker.generateUid()

            const selfMsg = {
              type: "CLIENT_CONNECTED",
              body: {
                id: ws.id
              }
            }

            ws.send(JSON.stringify(selfMsg))
            // ws.subscribe("test/mfiv14dEth")
            // this.logger.info("Opening")
            // const encoder = new TextEncoder()
            // eslint-disable-next-line no-debugger
            // debugger
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            // const path = ws.req.getUrl().toLocaleLowerCase() as string
            // console.log(`Opening path ${path}`)
            // ws.closed = false
            // const matchingRoute = this.wsRoutes[path]
            // const matchingRoute = streamNormalizedWS
            // ws.send(
            //   encoder.encode(
            //     JSON.stringify({
            //       topic: "MFIV.14D.ETH",
            //       stream: {
            //         id: "MFIV.14D.ETH",
            //         type: "index:mfiv",
            //         dVol: 42.0,
            //         invdVol: 77.0,
            //         methodology: "MFIV",
            //         timePeriod: "14D",
            //         asset: "ETH",
            //         underlying: 2222.42,
            //         timestamp: new Date()
            //       }
            //     })
            //   )
            // )
            // if (matchingRoute !== undefined) {
            //   // ws.subscribe("mfiv/14d/eth")
            //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            //   try {
            //     return streamNormalizedWS(ws, ws.req)
            //   } catch (err) {
            //     console.log("** ERROR ** ", err)
            //   }
            //   // return streamNormalizedWS(ws, ws.req)
            //   //   .then(_ => {
            //   //     console.log("inside matchingRoute")
            //   //     return
            //   //   })
            //   //   .catch(err => console.error("** ERROR **", err))
            // } else {
            //   ws.end(1008)
            // }
          },

          message: (
            app: { publish: (topic: string, data: any) => void },
            socket: WebSocket,
            message: any,
            isBinary: boolean,
            topic: string
          ) => {
            const decoder = new TextDecoder()

            const clientMsg = JSON.parse(decoder.decode(message))
            let serverMsg = {}

            console.log("clientMsg", clientMsg)

            switch (clientMsg.type) {
              case MESSAGE_ENUM.CLIENT_MESSAGE:
                serverMsg = {
                  type: MESSAGE_ENUM.CLIENT_MESSAGE,
                  body: clientMsg.body
                }

                app.publish(MESSAGE_ENUM.CLIENT_MESSAGE, JSON.stringify(serverMsg))
                break
              default:
                console.log("Unknown message type.")
            }

            // this.logger.info("topic", topic)
            // this.logger.info("isBinary", isBinary)
            // this.logger.info("** Message **", decoder.decode(message))

            // const decodedMessage = JSON.parse(decoder.decode(message))

            // if (decodedMessage.message === "SUBSCRIBE") {
            //   this.logger.info("Subscribing")
            //   socket.subscribe("test/mfiv14dEth")
            // }
            // //  else {
            // //   const ok = socket.send(message, isBinary)
            // // }
            // // this.wsRoutes.publish()

            // socket.publish("home/sensors/temperature", message)

            // if (socket.onmessage !== undefined) {
            //   this.logger.info("Calling onmessage")
            //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            //   socket.onmessage(message)
            // }
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
        health: {
          rest: "GET /health",

          handler(ctx: Context<void>) {
            return { status: "OK" }
            // return ctx.call("$node.health")
          }
        }

        // announce: {
        //   ws: {
        //     // topic: "eth.mfiv.14d.expiry",

        //     publish: true,

        //     send: false,
        //     // If defined and is a callback, a client will only be subscribed to the topic if the callback returns true.
        //     // Optional
        //     condition: true // Should return a truthy result
        //   },

        //   port: 3000,

        //   handler(context: Context<OptionSummary>) {
        //     const message = context.params

        //     throw new Error("Shouldn't be here")
        //     // if (wsList.length > 0) {
        //     //   console.log("topics", wsList[0].getTopics())
        //     //   wsList[0].publish("mfiv/expiry", JSON.stringify(message))
        //     // }
        //     return message
        //     // wsList[0].publish("mfiv/expiry", JSON.stringify(message))
        //     // const decoder = new TextDecoder()
        //     // const index = JSON.parse(decoder.decode(message)) as Record<string, unknown>

        //     //            const decoded = decoder.decode(message as Buffer)
        //     // const encoder = new TextEncoder()

        //     // this.logger.info("Received Message", message)

        //     // const result = context.params.result
        //     // const { dVol, invdVol, currency, value } = result

        //     // const index = {
        //     //   type: context.params.type,
        //     //   at: context.params.params.at,
        //     //   dVol,
        //     //   invdVol,
        //     //   currency,
        //     //   value
        //     // }

        //     // /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
        //     // this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

        //     return message
        //     // ts-config ignore
        //     /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
        //     // this.server.publish("mfiv.14d.eth", encoder.encode(JSON.stringify(index)), true, false)

        //     // const connectionContext = ctx.meta.c_ctx
        //     // Do something with the message and return the results(Optional)
        //   }
        // }
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
            const encoder = new TextEncoder()
            const result = context.params.result
            const { dVol, invdVol, currency, value } = result
            const methodology = context.params.context.methodology.toUpperCase()
            const timePeriod = context.params.context.windowInterval.toUpperCase()
            const serverMsg = {
              channel: "MFIV/14D/ETH",
              data: {
                id: `${methodology}.${timePeriod}.${currency}`,
                type: "index",
                dVol,
                invdVol,
                value,
                underlying: context.params.params.underlyingPrice,
                methodology,
                timePeriod,
                asset: currency,
                risklessRate: context.params.context.risklessRate,
                risklessRateAt: context.params.context.risklessRateAt,
                risklessRateSource: context.params.context.risklessRateSource,
                timestamp: context.params.params.at
              }
            }

            await this.server.publish("MFIV/14D/ETH", encoder.encode(JSON.stringify(serverMsg)), false)
            // this.logger.info("index.created", index)
            // const payload = { topic: "MFIV/14D/ETH", message: index }
            // const message = (this.settings.encoder as TextEncoder).encode(JSON.stringify(payload))
            // /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // await this.server.publish("MFIV/14D/ETH", message, false)
          }
        }
      }

      // started(this: WSService) {
      //   return Promise.resolve()
      // }
    })
  }
}
