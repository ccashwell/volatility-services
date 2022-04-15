import blessed, { ChartOptions } from "blessed"
import contrib from "blessed-contrib"
import { OptionSummary } from "node-volatility-mfiv"
import util from "util"
import WebSocket from "ws"

const decoder = new util.TextDecoder()
const transactionsData: ChartOptions = {
  title: "Near Options",
  style: { line: "yellow" },
  x: [
    "00:00",
    "00:05",
    "00:10",
    "00:15",
    "00:20",
    "00:30",
    "00:40",
    "00:50",
    "01:00",
    "01:10",
    "01:20",
    "01:30",
    "01:40",
    "01:50",
    "02:00",
    "02:10",
    "02:20",
    "02:30",
    "02:40",
    "02:50",
    "03:00",
    "03:10",
    "03:20",
    "03:30",
    "03:40",
    "03:50",
    "04:00",
    "04:10",
    "04:20",
    "04:30"
  ],
  y: [
    0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72,
    70, 0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80,
    72, 70, 0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89,
    80, 72, 70
  ]
}

const transactionsData1: ChartOptions = {
  title: "Next Options",
  style: { line: "red" },
  x: [
    "00:00",
    "00:05",
    "00:10",
    "00:15",
    "00:20",
    "00:30",
    "00:40",
    "00:50",
    "01:00",
    "01:10",
    "01:20",
    "01:30",
    "01:40",
    "01:50",
    "02:00",
    "02:10",
    "02:20",
    "02:30",
    "02:40",
    "02:50",
    "03:00",
    "03:10",
    "03:20",
    "03:30",
    "03:40",
    "03:50",
    "04:00",
    "04:10",
    "04:20",
    "04:30"
  ],
  y: [
    0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30,
    0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30,
    0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30
  ]
}

const tableData: string[][] = []
const ws = new WebSocket("ws://0.0.0.0:3000/ws")
ws.binaryType = "arraybuffer"
ws.on("open", () => {
  // console.info("Subscribed to messages")
})
  .on("ping", () => {
    ws.pong()
  })
  .on("message", message => {
    const buffer = message as ArrayBuffer
    const index = JSON.parse(decoder.decode(buffer)) as { topic: string; data: unknown }
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
      tableData.push([at, dVol.toString(), invdVol.toString()])
    } else if (index.topic === "mfiv/expiry") {
      const payload = index.data as OptionSummary
      const expirationDate = payload.expirationDate as unknown as string
      const nearExpiry = "2022-03-04T08:00:00.000Z"
      const nextExpiry = "2022-03-11T08:00:00.000Z"

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      log.log(`${payload.timestamp} : ${payload.symbol} : ${payload.underlyingPrice}`)
      // console.log(`${payload.symbol} : ${payload.underlyingPrice}`)
      if (expirationDate === nearExpiry) {
        transactionsData.y.shift()
        transactionsData.y.push(payload.underlyingPrice)
      } else if (expirationDate === nextExpiry) {
        transactionsData1.y.shift()
        transactionsData1.y.push(payload.underlyingPrice)
      } else {
        console.log("received: %j", index)
      }
    }

    // return resolve(index)
  })

const screen = blessed.screen()
const grid = new contrib.grid({ rows: 12, cols: 12, screen })
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const log = grid.set(6, 0, 6, 6, contrib.log, { fg: "green", selectedFg: "green", label: "Options Log" })
const table = grid.set(6, 6, 6, 6, contrib.table, {
  fg: "green",
  selectedFg: "green",
  selectedBg: "black",
  label: "MFIV.14D.ETH",
  width: "30%",
  height: "30%",
  border: { type: "line", fg: "cyan" },
  columnSpacing: 10, //in chars
  columnWidth: [25, 12, 12] /*in chars*/
})

table.setData({
  headers: ["Estimated At", "dVol", "invdVol"],
  data: tableData
})
// const table = grid.set(
//   6,
//   6,
//   6,
//   6,
//   contrib.table({
//     fg: "white",
//     selectedFg: "white",
//     selectedBg: "blue",
//     interactive: "true",
//     label: "Active Processes",
//     width: "30%",
//     height: "30%",
//     border: { type: "line", fg: "cyan" },
//     columnSpacing: 10, //in chars
//     columnWidth: [16, 12, 12] /*in chars*/
//   })
// )

// table.setData({
//   headers: ["Estimated At", "dVol", "invdVol"],
//   data: [
//     [colors.blue("1111"), "22222", "55555"],
//     ["33333", "44444", "66666"]
//   ]
// })

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const transactionsLine = grid.set(0, 0, 6, 12, contrib.line, {
  // showNthLabel: 5,
  numYLabels: 20,
  maxY: 2955,
  minY: 2925,
  label: "Deribit Option Summaries",
  showLegend: true,
  legend: { width: 15 }
})

// function setLineData(mockData: ChartOptions[], line: any) {
//   mockData.forEach(value => {
//     const last = value.y[value.y.length - 1]
//     value.y.shift()
//     const num = Math.max(last + Math.round(Math.random() * 10) - 5, 10)
//     value.y.push(num)
//   })

//   // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
//   // line.setData(mockData)
// }

setInterval(function () {
  // setLineData([transactionsData, transactionsData1], transactionsLine)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  // transactionsLine
  // console.log(transactionsLine)
  //  console.log(transactionsLine.getOptionsPrototype())
  const maxY = Math.max(...transactionsData.y, ...transactionsData1.y)
  const minY = Math.min(...transactionsData.y, ...transactionsData1.y)

  transactionsLine.options.maxY = maxY
  transactionsLine.options.minY = minY
  //  console.log(transactionsData.y.length, transactionsData1.y.length)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  transactionsLine.setData([transactionsData, transactionsData1])

  table.setData({
    headers: ["Estimated At", "dVol", "invdVol"],
    data: tableData
  })

  screen.render()
}, 500)

//set log dummy data
// setInterval(function () {
//   screen.render()
// }, 500)

screen.key(["escape", "q", "C-c"], function (_ch, key) {
  ws.close()
  return process.exit(0)
})

// fixes https://github.com/yaronn/blessed-contrib/issues/10
screen.on("resize", function () {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  transactionsLine.emit("attach")
  // log.emit("attach")
})

screen.render()
