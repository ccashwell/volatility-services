import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import { Asset } from "node-volatility-mfiv"
import WebSocket from "ws"

dayjs.extend(utc)
dayjs.extend(duration)

interface Index {
  risklessRate: number
  risklessRateAt: string
  risklessSource: string
  value: number
  dVol: number
  invdVol: number
  methodology: string
  asset: Asset
  timestamp: string | Date
}

//const url = "wss://ws.stage.volatility.com/ws"
let dailyValues: WebSocket.Data[] = []

const fetchIndex = async (replayFrom: dayjs.Dayjs, replayTo: dayjs.Dayjs) => {
  let lastMessage: WebSocket.Data | undefined
  const url = process.env.USE_LOCALHOST ? "ws://localhost:3000/ws?apiKey=123" : "wss://ws.stage.volatility.com/ws"
  const ws = new WebSocket(url)

  console.info("replaying", {
    replayFrom: replayFrom.toISOString(),
    replayTo: replayTo.toISOString()
  })
  const finished = new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      //      console.info("[onopen]")

      ws.send(
        JSON.stringify({
          type: "SUBSCRIBE",
          channel: `MFIV/14D/ETH`,
          replayFrom: replayFrom.toISOString(),
          replayTo: replayTo.toISOString(),
          __record__: true
          // replayFrom: "2021-10-01T07:00:00.000Z",
          // replayTo: "2021-10-01T07:02:00.000Z"
        })
      )
    }

    ws.onmessage = message => {
      console.info(message.data)

      lastMessage = message.data
    }

    ws.onclose = () => {
      //      console.info("[onclose]")
      lastMessage ? dailyValues.push(JSON.parse(lastMessage.toString())) : console.log("lastMessage is undefined")
      lastMessage = undefined
      resolve()
    }

    ws.onerror = err => {
      //      console.error("[onerror]", err)
      reject(err)
    }
  })

  return finished
}

async function main() {
  const startAt = "2022-01-01T00:00:00.000Z"
  const endAt = "2022-01-03T00:00:00.000Z"

  // const startAt = "2021-05-26T18:15:00.000Z"
  // const endAt = "2021-05-26T18:16:00.000Z"
  // const startAt = "2021-03-01T07:00:00.000Z"
  // const endAt = "2021-05-01T07:00:00.000Z"

  let $replayFrom = dayjs.utc(startAt)
  let $end = dayjs.utc(endAt)

  while ($replayFrom < $end) {
    // let $replayTo = $replayFrom.add(18 * 60 + 16, "minutes")
    // console.log("args", { start: $replayFrom.toISOString(), end: $replayTo.toISOString() })
    let $replayTo = $replayFrom.add(1, "days")
    await fetchIndex($replayFrom, $replayTo)
    // console.log("daily", dailyValues)
    console.log("processed", $replayFrom.toISOString())
    // dailyValues = []
    // .then(() => {
    //   console.info("[finished]")
    //   console.log("daily", dailyValues)
    // })
    // .catch(err => {
    //   console.error("[catch]", err)
    // })
    $replayFrom = $replayTo
    // $replayFrom = $replayFrom.add(1, "days")
  }
}

;(async () => {
  console.log("start", new Date())
  await main()
  console.log(">>>>>")
  console.log(dailyValues)
  console.log("finish", new Date())
})()
