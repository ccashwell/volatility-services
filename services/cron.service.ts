"use strict"
import { Service, ServiceBroker } from "moleculer"
import Cron from "@volatilitygroup/moleculer-cron"
import config from "../configuration"

/**
 * Compute index values from data produced by the ingest service
 */
export default class CronService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "cron",
      mixins: [Cron],
      settings: {
        exchange: config.mfiv.exchange,
        baseCurrency: config.mfiv.baseCurrency,
        interval: config.mfiv.interval
      },
      crons: [
        {
          name: "JobIPFS",
          cronTime: "*/5 * * * *",
          onTick: async () => {
            this.logger.info("Start JobIPFS")
            await this.actions.ipfs()
          },
          timeZone: "UTC"
        }
      ],
      methods: {
        ipfs() {
          // this.broker.call("index.estimate", params)
          // this.broker.emit("methodology.index")
          // call.broker.("methodology.index")
          this.logger.info("Would write IPFS value @", new Date().toISOString())
          return Promise.resolve()
        }
      }
    })
  }
}
