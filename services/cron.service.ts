/* eslint-disable no-debugger */
"use strict"
import { IIndex } from "@interfaces"
import { handleError } from "@lib/handlers/errors"
import { toIsoNoMs } from "@lib/utils"
import * as IndexHelper from "@service_helpers"
import { Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import { ResultAsync } from "neverthrow"
import configuration from "../src/configuration"

/**
 * Compute index values from data produced by the ingest service
 */
export default class CronService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: "cron",
      mixins: [Cron],
      settings: configuration.cronSettings,
      crons: [
        {
          name: "mfiv.14d.ETH.estimate",
          cronTime: "*/5 * * * *",
          onTick: () => {
            this.logger.info("Cron Job", "MFIV.14d.ETH")
            const provider = paramsProvider({ requestId: this.broker.generateUid() })
            const createIdx = (): Promise<IIndex.EstimateResponse> =>
              IndexHelper.estimate(this, provider.estimate.params())
            return ResultAsync.fromPromise(createIdx(), handleError)
              .map(JSON.stringify)
              .map(provider.ipfs.params)
              .map(res => this.broker.call("ipfs.store", res))
          },
          timeZone: "UTC"
        }
      ]

      // methods: {}
    })
  }
}

/**
 * Swiss army knife for providing arguments to pipelined closures
 * @returns map of dependencies to instances
 */
const paramsProvider = ({ requestId }: { requestId: string }) => {
  const at = new Date()
  const fleekKeyBuilder = () => {
    const { methodology, interval, baseCurrency } = configuration.cronSettings.estimate
    return `/indices/methodology=${methodology}/interval=${interval}/currency=${baseCurrency}/at=${toIsoNoMs(
      at
    )}/evidence.json`
  }
  const fleekUri = fleekKeyBuilder()

  return {
    estimate: {
      params: () => {
        const utcMin = at.getUTCMinutes()
        at.setUTCMinutes(Math.trunc(utcMin / 5) * 5, 0, 0)
        return { ...configuration.cronSettings.estimate, at: at.toISOString() } as IIndex.EstimateParams
      }
    },
    ipfs: {
      params: (jsonStr: string) => {
        const buffer = Buffer.from(jsonStr)
        return {
          key: fleekUri,
          data: buffer,
          metadata: {
            fileSize: buffer.length,
            mimeType: "application/json",
            requestId,
            priceId: "mfiv.14d.eth"
          }
        }
      }
    }
  }
}

// const ipfsResult = await this.broker.call("ipfs.store")
// this.logger.info("ipfsResult", ipfsResult)
// await createIdx()
// await ResultAsync.fromPromise(createIdx(), handleError).map()
// const mfivConfig = config.mfiv
// const result = await ResultAsync.fromPromise(this.createIndex(mfivConfig), handleError)
// const result = await this.createIndex(mfivConfig)
// ResultAsync.fromPromise(createIndex(mfivConfig), handleError)
// const indexResult = await this.broker.call("index.estimate", {
//   at: new Date().toISOString(),
//   ...mfivConfig
// })
// const ipfsResult = await this.broker.call("ipfs.store")
// return await this.broker.emit("mfiv.14d.ETH.estimate")
// await this.actions.ipfs("mfiv.14d.ETH.estimate")
