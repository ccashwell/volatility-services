"use strict"

import util from "util"
import * as _ from "lodash"
import kleur from "kleur"
import WebSocket from "ws"

// function getStatusString(sta) {
// 	switch (sta) {
// 		case C.STATUS_ACTIVE:
// 			return kleur.green().bold("Active");
// 		case C.STATUS_INACTIVE:
// 			return kleur.yellow().bold("Inactive");
// 		case C.STATUS_DELETED:
// 			return kleur.red().bold("Deleted");
// 		default:
// 			return sta;
// 	}
// }

module.exports = {
  command: "websocket",
  description: "Read from realtime websocket",
  alias: ["websockets", "w"],
  // options: [
  // 	{
  // 		option: "-f, --filter <match>",
  // 		description: "filter aliases (e.g.: 'users')"
  // 	}
  // ],
  action(broker, args) {
    const ws = new WebSocket("ws://localhost:3000/ws")
    // ws.binaryType = "arraybuffer"
    let timer // : NodeJS.Timeout
    const encoder = new util.TextEncoder()
    const decoder = new util.TextDecoder()

    const ping = () => {
      clearTimeout(timer)
      const msg = {
        type: new Uint8Array([57])
      }
      ws.send(JSON.stringify(msg))
    }

    ws.on("open", () => {
      timer = setTimeout(ping, 5000)
      // ws.subscribe("mfiv.14d.eth.expiry")
      ws.on("message", message => {
        // console.log("Message Received:", message)
      })
    })
    // return service.call("ws.announce", evidence)

    //const { options } = args;
    //console.log(options);
    // const users = await broker.call(
    // 	"v1.accounts.find",
    // 	{ sort: "username" },
    // 	{ meta: { $repl: true } }
    // );

    // const data = [
    //   [
    //     kleur.bold("ID"),
    //     kleur.bold("Username"),
    //     kleur.bold("Full name"),
    //     kleur.bold("E-mail"),
    //     kleur.bold("Roles"),
    //     kleur.bold("Verified"),
    //     kleur.bold("Status")
    //   ]
    // ]

    // const hLines = []

    // users.forEach(user => {
    //   // if (
    // 	args.options.filter &&
    // 	!item.fullPath.toLowerCase().includes(args.options.filter.toLowerCase())
    // )
    // 	return;

    // data.push([
    //   user.id,
    //   user.username,
    //   user.fullName,
    //   user.email,
    //   user.roles,
    //   user.verified ? kleur.green().bold("✔") : kleur.yellow().bold("✖"),
    //   getStatusString(user.status)
    // ])
  }

  // const tableConf = {
  //   border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
  //   columns: {
  //     5: { alignment: "center" },
  //     6: { alignment: "center" }
  //   },
  //   drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
  // }

  // console.log(table(data, tableConf))
}
