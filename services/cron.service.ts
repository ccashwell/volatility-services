import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  SymbolTypeEnum
} from "@entities/types"
import { IIndex } from "@interfaces"
import { handleError } from "@lib/handlers/errors"
import { toUnixTimestamp } from "@lib/utils/date"
import { ensure } from "@lib/utils/ensure"
import * as IndexHelper from "@service_helpers"
import { Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"
import { ResultAsync } from "neverthrow"

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
        estimate: {
          exchange: process.env.CRON_ESTIMATE_EXCHANGE as MethodologyExchangeEnum,
          methodology: process.env.CRON_METHODOLOGY as MethodologyEnum,
          timePeriod: process.env.CRON_INTERVAL,
          symbolType: process.env.CRON_SYMBOL_TYPE as SymbolTypeEnum,
          expiryType: process.env.CRON_EXPIRY_TYPE as MethodologyExpiryEnum,
          contractType: ["call_option", "put_option"]
        } as Omit<IIndex.EstimateParams, "at">
      },

      dependencies: process.env.ONLY_SERVICE ? [] : ["index-eth", "index-btc"],

      crons: [
        // {
        //   name: "mfiv.14d.ETH.estimate",
        //   cronTime: process.env.MFIV_14D_ETH_CRONTIME,
        //   onTick: () => {
        //     this.logger.info("Cron Job", "MFIV.14D.ETH")
        //     const provider = paramsProvider({
        //       requestId: this.broker.generateUid(),
        //       settingsEstimate: this.settings.estimate as Omit<IIndex.EstimateParams, "at">
        //     })
        //     const createIdx = (): Promise<IIndex.EstimateResponse> =>
        //       IndexHelper.estimate(this, provider.estimate.params())
        //     return ResultAsync.fromPromise(createIdx(), handleError)
        //       .map(JSON.stringify)
        //       .map(provider.ipfs.params)
        //       .map(res => this.broker.call("ipfs.store", res))
        //   },
        //   timeZone: "UTC"
        // },
        {
          name: "MFIV.14D.ETH.ESTIMATE",
          cronTime: ensure("CRON_MFIV_ETH_UPDATE_CRONTIME"),
          onTick: async () => {
            this.logger.info("CronJob: MFIV.14D.ETH.ESTIMATE", "MFIV.14D.ETH")
            const settingsEstimate = this.settings.estimate as Omit<IIndex.EstimateParams, "asset" | "at">
            await this.computeAndStoreEstimate({
              at: new Date(),
              asset: BaseCurrencyEnum.ETH,
              ...settingsEstimate
            }).mapErr((err: Error) => this.logger.error(err))
          },
          timeZone: "UTC"
        },
        {
          name: "MFIV.14D.BTC.ESTIMATE",
          cronTime: ensure("CRON_MFIV_BTC_UPDATE_CRONTIME"),
          onTick: async () => {
            this.logger.info("CronJob: MFIV.14D.BTC.ESTIMATE", "MFIV.14D.BTC")
            const settingsEstimate = this.settings.estimate as Omit<IIndex.EstimateParams, "asset" | "at">
            await this.computeAndStoreEstimate({
              at: new Date(),
              asset: BaseCurrencyEnum.BTC,
              ...settingsEstimate
            }).mapErr((err: Error) => this.logger.error(err))
          },
          timeZone: "UTC"
        }
      ],

      methods: {
        /**
         * Compute an index value based on settingsEstimate and write it to the DB and IPFS
         * @param settingsEstimate
         * @returns stringified JSON for sending to IPFS
         */
        computeAndStoreEstimate(settingsEstimate: IIndex.EstimateParams) {
          //const settingsEstimate = this.settings.estimate as Omit<IIndex.EstimateParams, "asset" | "at">
          const provider = paramsProvider({
            requestId: this.broker.generateUid(),
            settingsEstimate
          })
          // Patch when we report `at` since this isn't dependent on IPFS
          provider.estimate = {
            params: () => settingsEstimate
          }

          const createIdx = (): Promise<IIndex.EstimateResponse> =>
            IndexHelper.estimate(this, provider.estimate.params())
          return ResultAsync.fromPromise(createIdx(), handleError).map(JSON.stringify)
        }
      }
    })
  }
}

const fleekKeyBuilder = ({
  methodology,
  timePeriod,
  asset,
  at
}: Pick<IIndex.EstimateParams, "methodology" | "timePeriod" | "asset" | "at">) => {
  return `/indices/methodology=${methodology}/timePeriod=${timePeriod}/asset=${asset}/at=${toUnixTimestamp(
    at
  )}/evidence.json`
}

/**
 * Swiss army knife for providing arguments to pipelined closures
 * @returns map of dependencies to instances
 */
const paramsProvider = ({
  requestId,
  settingsEstimate
}: {
  requestId: string
  settingsEstimate: Omit<IIndex.EstimateParams, "at">
}) => {
  const at = new Date()
  const fleekUri = fleekKeyBuilder({ at, ...settingsEstimate })
  const { methodology, timePeriod, asset } = settingsEstimate

  return {
    estimate: {
      params: () => {
        const utcMin = at.getUTCMinutes()
        at.setUTCMinutes(Math.trunc(utcMin / 1) * 1, 0, 0)
        return { ...settingsEstimate, at: at.toISOString() } as IIndex.EstimateParams
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
            priceId: `${methodology}.${timePeriod}.${asset}`
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
// return await this.broker.emit("MFIV.14D.ETH.estimate")
// await this.actions.ipfs("MFIV.14D.ETH.estimate")
