/* eslint-disable camelcase */
import { Context, Service, ServiceBroker } from "moleculer"
import {
  default as ApiGateway,
  DISABLED,
  HttpResponse,
  TemplatedApp,
  us_socket_context_t,
  WebSocket
} from "moleculer-web-uws"
import { MfivEvidence, OptionSummary } from "node-volatility-mfiv"
import { TextDecoder, TextEncoder } from "util"
import { streamNormalizedWS } from "../src/ws/stream"

const MESSAGE_ENUM = Object.freeze({
  SUBSCRIBE: "SUBSCRIBE",
  SELF_CONNECTED: "SELF_CONNECTED",
  CLIENT_CONNECTED: "CLIENT_CONNECTED",
  CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
  CLIENT_MESSAGE: "CLIENT_MESSAGE"
})

/**
 * Compute index values from data produced by the ingest service
 */
export default class WSService extends Service {
  encoder = new TextEncoder()
  decoder = new TextDecoder()
  server!: TemplatedApp
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
        logRequestParams: "info",

        port: 3000,

        ws: {
          path: "/ws",

          compression: DISABLED,

          maxPayloadLength: 16 * 1024,

          idleTimeout: 60,

          maxBackpressure: 5 * 1024 * 1024,

          closeOnBackpressureLimit: true,

          // authenticate: true,

          // authorize(ctx: Context) {
          //   console.log("***** HERE 1")
          //   // const { req, res } = ctx.params
          //   // let accessToken = req.query["api_key"]

          //   // if (accessToken) {
          //   //   if (accessToken === "12345") {
          //   //     // valid credentials. It will be set to `ctx.meta.auth`
          //   //     return { id: 1, username: "john.doe", name: "John Doe" }
          //   //   }

          //   //   // invalid credentials
          //   //   throw new Error("Could not login user!")
          //   // } else {
          //   //   // anonymous user
          //   //   return null
          //   // }
          // },

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
            let authToken = ""

            try {
              // reqWithHeaders = req as { headers: Record<string, string> }
              // authHeader = reqWithHeaders.headers.authorization

              // Browsers don't support setting the Authentication header so check query params
              // if (!authHeader) {
              //   const httpReq = req as HttpRequest
              //   const queryObject = url.parse(httpReq.getUrl(), true).query
              //   const maybeApiKey = queryObject.api_key as string | undefined

              //   if (maybeApiKey) {
              //     authToken = maybeApiKey
              //   }
              // } else {
              if (true || (authHeader && authHeader.startsWith("Bearer "))) {
                // authToken = authHeader.slice("Bearer ".length)
                // TODO: Remove test token
                authToken = "d79401a4b79748c3489822c117f8e380e285719d9b0053e78edce9314f72d2db"
              }
              // }
            } catch (err) {
              this.logger.error("error:", err)
              throw err
            }

            const tokenCheck = await this.broker.call("tokens.check", {
              token: authToken,
              type: "api-key"
            })

            if (!tokenCheck) {
              this.logger.debug("Authorization failed")
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
            // ws.subscribe(MESSAGE_ENUM.CLIENT_CONNECTED)
            // ws.subscribe(MESSAGE_ENUM.CLIENT_DISCONNECTED)
            // ws.subscribe(MESSAGE_ENUM.CLIENT_MESSAGE)
            ws.id = this.broker.generateUid()

            const selfMsg = {
              type: "CLIENT_CONNECTED",
              body: {
                id: ws.id
              }
            }

            ws.send(JSON.stringify(selfMsg))

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
            const clientMsg = JSON.parse(this.decoder.decode(message))
            const channel = clientMsg.channel
            let serverMsg = {}
            this.logger.debug("clientMsg", clientMsg)
            switch (clientMsg.type) {
              case MESSAGE_ENUM.CLIENT_MESSAGE:
                serverMsg = {
                  type: MESSAGE_ENUM.CLIENT_MESSAGE,
                  body: clientMsg.body
                }

                app.publish(MESSAGE_ENUM.CLIENT_MESSAGE, JSON.stringify(serverMsg))
                break
              case MESSAGE_ENUM.SUBSCRIBE:
                serverMsg = {
                  type: MESSAGE_ENUM.SUBSCRIBE,
                  body: clientMsg.body
                }

                if (channel === "MFIV/14D/ETH" || channel === "MFIV/14D/BTC") {
                  this.logger.info("Subscribed", channel)
                  socket.subscribe(channel)
                } else {
                  socket.send(
                    JSON.stringify({ error: "topic_not_found", message: `Topic ${topic} not found`, code: 400 })
                  )
                }

                break
              default:
                this.logger.error("Unknown message type.", clientMsg)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                socket.disconnect()
            }
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
        }
      },
      actions: {
        // authorize(ctx: Context<unknown>) {
        //   console.log("***** HERE 2")
        // const { req, res } = ctx.params
        // let accessToken = req.query["api_key"]

        // if (accessToken) {
        //   if (accessToken === "12345") {
        //     // valid credentials. It will be set to `ctx.meta.auth`
        //     return { id: 1, username: "john.doe", name: "John Doe" }
        //   }

        //   // invalid credentials
        //   throw new Error("Could not login user!")
        // } else {
        //   // anonymous user
        //   return null
        // }
        // },

        health: {
          rest: "GET /health",

          handler() {
            return { status: "OK" }
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
        "MFIV.14D.ETH.expiry": {
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

        "MFIV.14D.ETH.index.created": {
          handler(this: WSService, context: Context<MfivEvidence>) {
            const result = context.params.result
            const { dVol, invdVol, asset, value } = result
            const methodology = context.params.context.methodology.toUpperCase()
            const timePeriod = context.params.context.timePeriod.toUpperCase()
            const serverMsg = {
              channel: "MFIV/14D/ETH",
              data: {
                id: `${methodology}.${timePeriod}.${asset}`,
                type: "index",
                dVol,
                invdVol,
                value,
                underlying: context.params.params.underlyingPrice,
                methodology,
                timePeriod,
                asset,
                risklessRate: context.params.context.risklessRate,
                risklessRateAt: context.params.context.risklessRateAt,
                risklessRateSource: context.params.context.risklessRateSource,
                timestamp: context.params.params.at
              }
            }

            this.logger.info("Sending MFIV")
            this.server.publish("MFIV/14D/ETH", this.encoder.encode(JSON.stringify(serverMsg)), false)
            // this.logger.info("index.created", index)
            // const payload = { topic: "MFIV/14D/ETH", message: index }
            // const message = (this.settings.encoder as TextEncoder).encode(JSON.stringify(payload))
            // /* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            // await this.server.publish("MFIV/14D/ETH", message, false)
          }
        },
        "MFIV.14D.BTC.index.created": {
          handler(this: WSService, context: Context<MfivEvidence>) {
            const result = context.params.result
            const { dVol, invdVol, asset, value } = result
            const methodology = context.params.context.methodology.toUpperCase()
            const timePeriod = context.params.context.timePeriod.toUpperCase()
            const serverMsg = {
              channel: "MFIV/14D/BTC",
              data: {
                id: `${methodology}.${timePeriod}.${asset}`,
                type: "index",
                dVol,
                invdVol,
                value,
                underlying: context.params.params.underlyingPrice,
                methodology,
                timePeriod,
                asset,
                risklessRate: context.params.context.risklessRate,
                risklessRateAt: context.params.context.risklessRateAt,
                risklessRateSource: context.params.context.risklessRateSource,
                timestamp: context.params.params.at
              }
            }

            this.logger.info("Sending MFIV")
            this.server.publish("MFIV/14D/BTC", this.encoder.encode(JSON.stringify(serverMsg)), false)
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

  // authenticate(ctx: Context<unknown>) {
  //   debugger
  //   console.log("***** HERE 10", ctx)
  // }

  // @ts-ignore
  // authorize(ctx) {
  //   console.log("***** ", ctx)
  //   // @ts-ignore
  //   try {
  //     // @ts-ignoreHERE 4
  //     const { req, res } = ctx.params
  //     console.log("query", req.query)
  //     const apiKey = req.query["api_key"]
  //   } catch (err) {
  //     console.error("err", err)
  //   }
  // }
}
