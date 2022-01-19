"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { MfivParams, MfivResult } from "node-volatility-mfiv"
import fleek from "../datasources/fleek"

export default class IPFSService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "ipfs",

      // Settings
      settings: {},
      // Metadata
      metadata: {},
      // Dependencies
      dependencies: [],

      events: {
        "methodology.index": {
          async handler(ctx: Context<{ params: MfivParams; result: MfivResult }>) {
            // await fleek.upload(ctx.params.params.at.toString(), data)
            return Promise.resolve()
          }
        }
      },

      // Service methods
      async started(this: IPFSService) {
        this.logger.info("Start ipfs service")
        return Promise.resolve()
      }
    })
  }
}
