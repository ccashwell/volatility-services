import { TextDecoder, TextEncoder } from "util"
import { WebSocket } from "ws"

const ws = new WebSocket("ws://0.0.0.0:3000/ws")
const encoder = new TextEncoder()
const decoder = new TextDecoder()

ws.binaryType = "arraybuffer"
ws.on("open", () => {
  console.info("Subscribed to messages")

  const message = encoder.encode(
    JSON.stringify({
      topic: "test/draw",
      data: []
    })
  )
  ws.send(message)
})
  .on("ping", () => {
    ws.pong()
  })
  .on("message", message => {
    const buffer = message as ArrayBuffer
    const index = JSON.parse(decoder.decode(buffer)) as { topic: string; data: unknown }

    console.log(index.data)
    // JSON.parse(decoder.decode(message.data))

    if (index.topic === "MFIV/14D/ETH") {
      const payload = index.data as {
        type: string
        at: string
        dVol: number
        invdVol: number
        currency: string
        value: string
      }
      const { at, dVol, invdVol } = payload
    } else if (index.topic === "MFIV/expiry") {
      console.log("** index **", index)
    }

    // return resolve(index)
  })
