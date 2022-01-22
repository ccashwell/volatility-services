"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { MfivContext, MfivParams, MfivResult } from "node-volatility-mfiv"
import ipfs from "../datasources/fleek"

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
        "deribit.mfiv.ETH.14d.estimate": {
          async handler(
            context: Context<{ version: "2022-01-01"; context: MfivContext; params: MfivParams; result: MfivResult }>
          ) {
            const jsonString = JSON.stringify(context.params)
            const params = context.params.params
            const ctx = context.params.context

            this.logger.info("deribit.mfiv.ETH.14d.estimate", jsonString)
            // const key = `mf4.7d.ETH.DBO.
            // const key = `/estimates/methodology=mfiv/interval=14d/currency=ETH/exchange=deribit/instrument=option/ts=2022-01-01T00:05:00.000Z/mf4.14d.json`
            // eslint-disable-next-line max-len
            const key = `/indices/methodology=${ctx.methodology}/interval=${ctx.windowInterval}/currency=${ctx.currency}/exchange=${ctx.exchange}/instrument=option/ts=${params.at}/evidence.json`
            this.logger.info("ipfs.upload", { key, data: jsonString })
            const uploadResult = await ipfs.upload(key, Buffer.from(jsonString))
            if (uploadResult.isOk()) {
              this.logger.info("upload complete.")
              this.logger.warn("TODO: persist to db")
            } else {
              this.logger.error(uploadResult.error)
              this.logger.warn("TODO: Move to top-level error handler")
              throw uploadResult.error
            }
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
