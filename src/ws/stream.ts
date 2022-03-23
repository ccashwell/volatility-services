import { wait } from "@lib/utils/helpers"
import { streamNormalized } from "tardis-dev"
import { HttpRequest, WebSocket } from "uWebSockets.js"
import { debug } from "../debug"

export async function streamNormalizedWS(ws: WebSocket, req: HttpRequest) {
  let messages: AsyncIterableIterator<any> | undefined

  try {
    const startTimestamp = new Date().getTime()
    // const parsedQuery = qs.decode(req.getQuery())
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // const parsedQuery = qs.decode("foo=bar&#x26;abc=xyz&#x26;abc=123")
    // const optionsString = parsedQuery.options as string
    // console.info("optionsString", optionsString)
    // const streamNormalizedOptions = JSON.parse(optionsString) as StreamNormalizedRequestOptions
    // debug("WebSocket /ws-stream-normalized started, options: %o", streamNormalizedOptions)

    // const options = Array.isArray(streamNormalizedOptions) ? streamNormalizedOptions : [streamNormalizedOptions]
    const options = [{ exchange: "binance", symbols: ["ETHUSDT"] }]
    let subSequentErrorsCount = 0

    const messagesIterables = options.map(option => {
      // let's map from provided options to options and normalizers that needs to be added for dataTypes provided in options
      const msgs = streamNormalized(
        {
          exchange: "binance",
          symbols: ["ETHUSDT"],
          withDisconnectMessages: false,
          onError: error => {
            subSequentErrorsCount++

            debug("WebSocket /ws-stream-normalized WS connection error: %o", error)
          }
        }
        //...getNormalizers(option.dataTypes)
      )
      // separately check if any computables are needed for given dataTypes
      // const computables = getComputables(option.dataTypes)

      // if (computables.length > 0) {
      //   return compute(msgs, ...computables)
      // }

      return messages
    })

    // const filterByDataType = constructDataTypeFilter(options)
    // messages = messagesIterables.length === 1 ? messagesIterables[0] : combine(...messagesIterables)
    messages = messagesIterables[0] as AsyncIterableIterator<unknown>

    const message = {
      id: "mfiv.14d.ETH",
      symbols: ["ETHUSDT"],
      timestamp: new Date(),
      localTimestamp: new Date()
    }

    ws.send(JSON.stringify(message))
    // for await (const message of messages) {
    //   if (ws.closed) {
    //     return
    //   }

    //   const exchange = message.exchange as Exchange

    //   if (subSequentErrorsCount[exchange] !== undefined && subSequentErrorsCount[exchange]! >= 50) {
    //     ws.end(1011, `Too many subsequent errors when connecting to  ${exchange} WS API`)
    //     return
    //   }

    //   // if (!filterByDataType(message)) {
    //   //   continue
    //   // }

    //   const success = ws.send(JSON.stringify(message))
    //   // handle backpressure in case of slow clients
    //   if (!success) {
    //     let retries = 0
    //     while (ws.getBufferedAmount() > 0) {
    //       await wait(20)
    //       retries += 1

    //       if (retries > 2000) {
    //         ws.end(1008, "Too much backpressure")
    //         return
    //       }
    //     }
    //   }

    //   if (message.type !== "disconnect") {
    //     subSequentErrorsCount[exchange] = 0
    //   }
    // }

    while (ws.getBufferedAmount() > 0) {
      await wait(100)
    }

    ws.end(1000, "WS stream-normalized finished")

    // const endTimestamp = new Date().getTime()

    // debug(
    //   "WebSocket /ws-stream-normalized finished, options: %o, time: %d seconds",
    //   streamNormalizedOptions,
    //   (endTimestamp - startTimestamp) / 1000
    // )
  } catch (e: any) {
    if (!ws.closed) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
      ws.end(1011, e.toString())
    }

    debug("WebSocket /ws-stream-normalized  error: %o", e)
    console.error("WebSocket /ws-stream-normalized error:", e)
  } finally {
    // this will close underlying open WS connections
    if (messages !== undefined) {
      messages.return?.().catch(reason => console.error(reason))
    }
  }
}
