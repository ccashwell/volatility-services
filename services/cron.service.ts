/* eslint-disable no-debugger */
"use strict"
import { Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import { err, ok, Result, ResultAsync } from "neverthrow"
import { MfivEvidence } from "node-volatility-mfiv"
import configuration from "../configuration"
import { toIsoNoMs } from "@lib/utils"
import { handleError } from "@lib/handlers/errors"
import * as IndexHelper from "@service_helpers"
import { IIndex, IIPFS } from "@interfaces"

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
            // const createIdx = async () => {
            //   const params = provider.estimate.params()
            //   let result: Promise<IIndex.EstimateResponse>
            //   try {
            //     const foo = this.broker
            //       .call<IIndex.EstimateResponse, IIndex.EstimateParams>("index.estimate", params)
            //       .then(val => {
            //         debugger
            //         console.log(val)
            //         return val as MfivEvidence
            //       })
            //       .catch(reason => {
            //         debugger
            //         console.error(reason)
            //         throw reason
            //       })
            //     console.log("index.estimate()", foo)
            //     result = foo
            //     return result
            //       .then(estimate => {
            //         debugger
            //         console.log("index.estimate()", estimate)
            //         return result
            //       })
            //       .catch(err2 => {
            //         debugger
            //         console.log(err2)
            //         throw err2
            //       })
            //   } catch {
            //     debugger
            //     console.log(err)
            //   }
            // }

            // // IndexHelper.estimate(broker, provider.estimate.params())
            // const p = ResultAsync.fromPromise(createIdx(), handleError)
            //   .map((x: unknown) => {
            //     debugger
            //     console.log(x)
            //     return JSON.stringify(x as string)
            //     //return JSON.stringify(x)
            //     // return Result.fromThrowable(() => JSON.stringify(x), handleError)
            //     // return x === undefined ? err(new Error("x is undefined")) : ok(JSON.stringify(x))
            //   })
            //   .map(provider.ipfs.params)
            //   .map(res => {
            //     debugger
            //     const result: Promise<IIPFS.StoreResponse> = this.broker.call("ipfs.store", res)
            //     return result
            //   })
            //   .mapErr(err3 => {
            //     debugger
            //     console.error(err3)
            //     return err3
            //   })
            //   .then(success => {
            //     debugger
            //     if (success.isOk()) {
            //       console.log(success)
            //       return success.value
            //     } else {
            //       return success.error
            //     }
            //   })

            // debugger
            // console.log(p)
            // void p.andThen(res => {
            //   console.log(res)
            //   return res
            // })
            //p.orElse()
            // // .match(
            // //   () => this.logger.info("Cron job finished"),
            // //   err => {
            // //     this.logger.error("Cron job failed", handleError(err))
            // //     throw err
            // //   }
            // )
          },
          timeZone: "UTC"
        }
      ],

      methods: {}
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
        debugger
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
