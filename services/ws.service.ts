/* eslint-disable camelcase */
//import { VixCalculator } from '@lib/vix_calculator';
import { OptionBucket } from "@computables/option_bucket"
import { AppDataSource } from "@datasources/datasource"
import { MfivIndex } from "@entities/mfiv_index"
import { IIngest, IInstrumentInfo } from "@interfaces"
import { insufficientDataError } from "@lib/errors"
import { mfivDates, MfivExpiry } from "@lib/expiries"
import { handleError } from "@lib/handlers/errors"
import { PaginatedResponse } from "@lib/types"
import { ensure } from "@lib/utils/ensure"
import { VixCalculatorV2 as VixCalculator } from "@lib/vix_calculator_v2"
import { instrumentInfos } from "@service_helpers/instrument_info_helper"
import dayjs from "dayjs"
import { Context, Service, ServiceBroker, Validator } from "moleculer"
import {
  default as ApiGateway,
  DISABLED,
  HttpResponse,
  TemplatedApp,
  us_socket_context_t,
  WebSocket
} from "moleculer-web-uws"
import { combine, Result, ResultAsync } from "neverthrow"
import newrelic from "newrelic"
import {
  Asset,
  compute,
  MfivContext,
  MfivEvidence,
  MfivParams,
  MfivResult,
  MFIV_ASSETS,
  OptionSummary as MfivOptionSummary
} from "node-volatility-mfiv"
import { Exchange, OptionSummary, ReplayNormalizedOptions } from "tardis-dev"
import { chainFrom } from "transducist"
import { InsertResult } from "typeorm"
import { TextDecoder, TextEncoder } from "util"
import { streamNormalizedWS } from "../src/ws/stream"
import { initTardis } from "./../src/datasources/tardis"
import { historical } from "./../src/datasources/tardis_deribit_streams"
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  SymbolTypeEnum
} from "./../src/entities/types"
import { EstimateParams } from "./../src/interfaces/services/index/iindex.d"

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
  private latestMessage?: OptionSummary

  /**
   * @private
   */
  private subscriptionCheck = (() => {
    const v = new Validator()
    const schema = {
      $$root: true,
      type: "string",
      pattern: /MFIV\/\d+D\/(BTC|ETH|SOL)/
    }
    return v.compile(schema)
  })()

  /**
   * Keep a grouping of expiry dates => symbols so we can request a set of OptionSummary objects
   *
   * @private
   */
  private expiryMap = new Map<string, Set<string>>()

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
        apiKey: ensure("TARDIS_API_KEY"),

        instrumentInfoDefaults: {
          exchange: process.env.INGEST_EXCHANGE || "deribit",
          type: process.env.INGEST_TYPE || "option",
          timePeriod: process.env.INGEST_TIME_PERIOD || "14D",
          contractType: ["call_option", "put_option"],
          active: false
        },

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
            // Upon connecting, subscribe the socket to MFIV/${timePeriod}/${asset}
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

          message: async (
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

                const replayFrom = clientMsg.replayFrom
                const replayTo = clientMsg.replayTo
                const record = clientMsg.__record__ === true

                if (this.subscriptionCheck(channel)) {
                  this.logger.info("Subscribed", channel)
                  if (replayFrom === undefined && replayTo == undefined) {
                    socket.subscribe(channel)
                  } else {
                    const exchange = MethodologyExchangeEnum.Deribit
                    const [methodology, timePeriod, asset] = channel.split("/")
                    const reportFrequency = record ? 5 : undefined

                    await new VixCalculator({
                      apiKey: this.settings.apiKey,
                      exchange,
                      replayFrom,
                      replayTo,
                      reportFrequency,
                      asset,
                      timePeriod,
                      onCompute: index => {
                        this.logger.debug("onCompute(index)")
                        this.logger.trace("onCompute(index)", index)
                        socket.send(JSON.stringify(index))
                        this.logger.debug("send(index)")

                        if (record) {
                          executeMfivInsert({
                            timestamp: dayjs.utc(index.timestamp as string).toDate(),
                            dVol: index.dVol.toString(),
                            invdVol: index.invdVol.toString(),
                            timePeriod: index.timePeriod,
                            exchange: MethodologyExchangeEnum.Deribit,
                            asset: index.asset as BaseCurrencyEnum,
                            underlyingPrice: index.underlyingPrice.toString(),
                            nearExpiry: dayjs.utc(index.nearExpiry).toDate(),
                            nextExpiry: dayjs.utc(index.nextExpiry).toDate(),
                            extra: {
                              type: "idx",
                              rate: {
                                src: index.risklessRateSource,
                                val: index.risklessRate,
                                ts: dayjs.utc(index.risklessRateAt).toDate()
                              }
                            },
                            createdAt: dayjs.utc().toDate()
                          }).catch((err: Error) => this.logger.error("executeMfivInsert error", err))
                        }
                      },
                      onComplete: () => {
                        this.logger.debug("onComplete()")
                        this.logger.trace("socket complete. closing.")
                        socket.close()
                        this.logger.debug("close socket")
                      },
                      onError: (err: unknown) => {
                        this.logger.error("socket error. closing socket.", err as Error)
                        socket.close()
                        this.logger.debug("close socket")
                      },
                      logger: this.logger
                    })
                      .fetchIndex()
                      .catch((err: unknown) => {
                        this.logger.error("fetchIndex error", err)
                        // TODO: When err is HTTPError: Response code 503 (Service Temporarily Unavailable) we should retry
                      })

                    // this.logger.info("index result", result)
                    // this.replay(socket, { replayFrom, replayTo, exchange, timePeriod, asset, expiryType })
                  }
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
        //: Context<{apiKey:string}>
        // async authenticate(ctx) {
        //   const { req, res } = ctx.params
        //   const apiKey = req.query["apiKey"]
        //   throw new Error(`Could not find '${apiKey}`)
        // },
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
        },

        mfiv: {
          rest: "GET /mfiv",
          visibility: "public",
          params: {
            interval: { type: "string", enum: ["5M", "15M", "1H", "1D"], default: "15M" },
            dateFrom: { type: "date", convert: true, default: new Date("2022-01-01T00:00:00.000Z") },
            dateTo: { type: "date", convert: true, default: () => new Date() },
            timePeriod: { type: "string" },
            asset: { type: "string", enum: MFIV_ASSETS }
          },
          async handler(ctx: Context<ApiMfivParams>): Promise<PaginatedResponse<MfivIndex>> {
            this.logger.info("mfiv()", ctx)
            const interval = ctx.params.interval
            let counter = 0
            const filterMap: Record<string, number> = {
              "5M": 1,
              "15M": 3,
              "1H": 11,
              "1D": 287
            }

            if (filterMap[interval] === undefined) {
              return {
                data: [],
                prev: null,
                next: null
              }
            }

            return await queryMfiv(ctx.params)
              .then((arr: MfivIndex[]) => {
                return chainFrom(arr).takeNth(filterMap[interval]).toArray()
              })
              .then((arr: MfivIndex[]) => {
                return {
                  data: arr,
                  prev: null,
                  next: null
                }
              })
              .catch((err: Error) => {
                this.logger.error("queryMfiv error", err)
                return {
                  data: [],
                  prev: null,
                  next: null
                }
              })
            //            return { data: await queryMfiv(ctx.params), prev: null, next: null }
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
        "MFIV.*.*.index.created": {
          handler(this: WSService, context: Context<MfivEvidence>) {
            const result = context.params.result
            const { dVol, invdVol, asset, value } = result
            const methodology = context.params.context.methodology.toUpperCase()
            const timePeriod = context.params.context.timePeriod.toUpperCase()
            const channel = `${methodology}/${timePeriod}/${asset}`
            const serverMsg = {
              channel,
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
            this.server.publish(channel, this.encoder.encode(JSON.stringify(serverMsg)), false)
          }
        }
      },

      started(this: WSService) {
        return new Promise(resolve => {
          initTardis()
          resolve()
        })
      }
    })
  }

  // @ts-ignore
  // private async authenticate(req, res) {
  //   console.log("args", arguments)
  //   // @ts-ignore
  //   const { req, res } = ctx.params
  //   const apiKey = req.query["apiKey"]
  //   console.log("apiKey", apiKey)
  //   throw new Error(`Could not find '${apiKey}`)
  // }

  private async replay(
    ws: WebSocket,
    { replayFrom, replayTo, timePeriod, exchange, asset, expiryType }: ReplayOptions
  ) {
    const expiries = mfivDates(new Date(replayFrom), timePeriod, expiryType, asset)

    return void ResultAsync.fromPromise(
      this.fetchInstruments(expiries, { asset: asset, timestamp: replayFrom }),
      handleError
    )
      .map(
        replayNormalizedOptions({
          exchange,
          withDisconnectMessages: false,
          from: replayFrom,
          to: replayTo,
          waitWhenDataNotYetAvailable: true
        })
      )
      .map(historical)
      .mapErr(err => {
        this.logger.fatal(err)
        // reject(err)
        return err
      })
      .map(messages => {
        // resolve() // Let the service know we can start
        return this.process(ws, messages, [expiries], {
          methodology: MethodologyEnum.MFIV,
          timePeriod,
          asset,
          exchange,
          symbolType: SymbolTypeEnum.Option,
          contractType: ["call_option", "put_option"],
          expiryType: MethodologyExpiryEnum.FridayT08
        })
      })
      .mapErr(err => {
        this.logger.fatal(err)
        if (err instanceof Error) {
          newrelic.noticeError(err, { serviceName: this.name, expiries: JSON.stringify(expiries) })
        }
        return err
      })
  }

  private async process(
    ws: WebSocket,
    messages: AsyncIterableIterator<OptionSummary | OptionBucket>,
    expiries: MfivExpiry[],
    estimateParams: Omit<EstimateParams, "at">
  ): Promise<boolean> {
    this.logger.info("Start process.")
    for await (const message of messages) {
      if (message.type === "option_summary") {
        // Track the latest message
        this.latestMessage = message

        // Save to cache
        await this.cacheMessage(message)
      }

      if (message.type === "option_bucket") {
        // 1. Get near and far expiries
        const expiry = expiries.at(0)

        /**
         * Complete processing if no more expiries to process
         */
        if (expiry === undefined) {
          break
        }

        const nearExpiries = (
          await this.fetchOptionSummaries({
            expiry: expiry.nearExpiration,
            asset: expiry.asset as Asset
          })
        ).unwrapOr([])

        const nextExpiries = (
          await this.fetchOptionSummaries({
            expiry: expiry.nextExpiration,
            asset: expiry.asset as Asset
          })
        ).unwrapOr([])

        //const nearExpiries.unwrapOr([])

        // 2. get riskless rate
        const risklessRate = this.getInterestRate()
        // 3. Use this as 'most recent' underlying price
        const underlyingPrice = message.underlyingPrice
        // 4. Build mfiv params
        const mfivContext: MfivContext = {
          ...estimateParams,
          ...risklessRate
        }

        const mfivParams: MfivParams = {
          at: message.timestamp.toISOString(),
          nearDate: expiry.nearExpiration,
          nextDate: expiry.nextExpiration,
          options: [...nearExpiries, ...nextExpiries] as MfivOptionSummary[],
          underlyingPrice
        }

        // 5. Compute mfiv
        const maybeMfivResult = Result.fromThrowable(
          () => compute(mfivContext, mfivParams),
          err => {
            // this.logger.error("compute(mfivContext, mfivParams)", {
            //   mfivContext,
            //   mfivParams: JSON.stringify(mfivParams)
            // })
            // newrelic.noticeError(err as Error)
            return new Error("No index")
          }
        )()

        if (maybeMfivResult.isErr()) {
          continue
        }

        const mfivResult: MfivResult = maybeMfivResult.value
        const { intermediates, metrics, ...rest } = mfivResult
        const index = { underlyingPrice, ...rest, ...risklessRate }

        // this.logger.info("mfiv", index)
        // this.logger.info("mfiv", { timestamp: mfivResult.estimatedFor, dVol: mfivResult.dVol })
        // const { dVol, invdVol, estimatedFor } = mfivResult

        ws.send(JSON.stringify(index))
      }

      // this.broker.broadcast("MFIV.14D.ETH.expiry", message, ["ws"]).catch(handleAsMoleculerError)
    }

    this.logger.info("Finish process.")
    return true
  }

  private async fetchOptionSummaries(params: IIngest.OptionSummariesParams) {
    const cacher = this.broker.cacher
    if (cacher === undefined) {
      throw new Error("Cache should not be disabled")
    }

    const symbolList = this.expiryMap.get(params.expiry)
    if (!symbolList) {
      throw insufficientDataError("Expiry is missing from expiry map.", [
        `The requested expiry '${params.expiry}' has not been seen yet`,
        "Check that the expiry date matches an existing intrument's expirationDate."
      ])
    } else {
      return await combine(
        chainFrom(Array.from(symbolList.values()))
          .map(sym => ResultAsync.fromPromise(cacher.get(sym) as Promise<OptionSummary>, handleError))
          .toArray()
      )
    }
  }

  /**
   * Keep a cached list of option prices. This is a sideband operation
   * that does not await the promise.
   *
   * @remark TODO: Use ioredis mset
   *
   * @param o - OptionSummary to cache
   */
  private async cacheMessage(o: OptionSummary): Promise<void> {
    const expiryKey = o.expirationDate.toISOString()
    if (!this.expiryMap.has(expiryKey)) {
      this.logger.info("Cache Miss", expiryKey)
      // TODO: Should probably be ingesting into a Red-Black Tree
      this.expiryMap.set(expiryKey, new Set<string>())
    }
    const expirySet = this.expiryMap.get(expiryKey)
    expirySet?.add(o.symbol)
    if (this.broker.cacher) {
      await this.broker.cacher.set(
        o.symbol,
        summaryWithDefaults(o, { bestAskPrice: 0, bestBidPrice: 0, underlyingPrice: 0 })
      )
    }
  }

  private async fetchInstruments(
    expiries: { nearExpiration: string; nextExpiration: string },
    { asset, timestamp }: { asset: Asset; timestamp?: string }
  ): Promise<IInstrumentInfo.InstrumentInfoResponse> {
    const expirationDates = [expiries.nearExpiration, expiries.nextExpiration]
    this.logger.info("Fetching instruments with expiries", expirationDates)

    return instrumentInfos(this, {
      expirationDates,
      timestamp: timestamp ?? new Date().toISOString(),
      ...this.settings.instrumentInfoDefaults,
      asset
    }).then(values => {
      this.logger.info("infos", values)
      this.logger.info("infos.length", values.length)
      return values
    })
  }

  private getInterestRate() {
    return {
      risklessRate: 0.0056,
      risklessRateAt: "2022-03-17T17:17:00.702Z",
      risklessRateSource: "AAVE"
    }
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

function replayNormalizedOptions<E extends Exchange>({
  exchange,
  withDisconnectMessages,
  from,
  to
}: ReplayNormalizedOptions<E>) {
  return (symbols: IInstrumentInfo.InstrumentInfoResponse) => {
    console.log("Number of symbols", symbols.length)
    return {
      exchange: exchange as "deribit",
      symbols: symbols.sort(),
      withDisconnectMessages,
      from,
      to
    }
  }
}

async function executeMfivInsert(mfivIndex: MfivIndex): Promise<InsertResult> {
  return await AppDataSource.manager.createQueryBuilder().insert().into(MfivIndex).values([mfivIndex]).execute()
}

async function queryMfiv(params: ApiMfivParams): Promise<MfivIndex[]> {
  const { dateFrom, dateTo, timePeriod, asset } = params
  return (
    AppDataSource.manager
      .createQueryBuilder()
      .select([
        "index.timestamp",
        "index.timePeriod",
        "index.asset",
        "index.dVol",
        "index.invdVol",
        "index.underlyingPrice"
        // "index.extra"
        // "\"index.extra\"->'rate'->>'ts' AS \"risklessRateAt\""
      ])
      // .select(
      //   'index.timestamp, "index.timePeriod", index.asset, index.value, "index.invValue", "index.underlyingPrice", "index.extra"->\'rate\'->>\'ts\' AS "risklessRateAt", , "index.extra"->\'rate\'->>\'src\' AS "risklessRateSource", , "index.extra"->\'rate\'->>\'val\' AS "risklessRate"'
      // )
      .from(MfivIndex, "index")
      .where("index.timestamp >= :dateFrom", { dateFrom })
      .andWhere("index.timestamp < :dateTo", { dateTo })
      .andWhere('"timePeriod" = :timePeriod', { timePeriod })
      .andWhere("index.asset = :asset", { asset })
      .orderBy("index.timestamp", "ASC")
      .getMany()
  )
}

/**
 * OptionSummary data can have undefined price values. When this happens,
 * set price to defaults.
 *
 * @private
 *
 * @param o - option summary to override with defaults
 * @param { vals } - default values to be set in OptionSummary
 * @returns OptionSummary w/required price values
 */
const summaryWithDefaults = (
  o: OptionSummary,
  { bestAskPrice, bestBidPrice, underlyingPrice }: DefaultOptionSummary
) => ({
  ...o,
  bestAskPrice: o.bestAskPrice ?? bestAskPrice,
  bestBidPrice: o.bestBidPrice ?? bestBidPrice,
  underlyingPrice: o.underlyingPrice ?? underlyingPrice
})

type ReplayOptions = {
  replayFrom: string
  replayTo: string
  exchange: MethodologyExchangeEnum
  timePeriod: string
  asset: BaseCurrencyEnum
  expiryType: MethodologyExpiryEnum
}

interface DefaultOptionSummary {
  bestAskPrice: number
  bestBidPrice: number
  underlyingPrice: number
}

interface ApiMfivParams {
  interval: string
  dateFrom: Date
  dateTo: Date
  timePeriod: string
  asset: Asset
}
