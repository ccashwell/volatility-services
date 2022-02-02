"use strict"

import { ActionParams, Context, Service, ServiceBroker } from "moleculer"
import { Repository, getConnection } from "typeorm"
import { ResultAsync } from "neverthrow"
import fleek, { FleekResponse } from "@datasources/fleek"
import { FleekTransaction } from "@entities"
import connectionInstance from "@entities/connection"
import { IIPFS } from "@interfaces/services/ipfs"
import { IIPFSServiceMeta } from "@interfaces/meta"
import { handleError } from "@lib/handlers/errors"

export default class IPFSService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "ipfs",

      // Settings
      settings: {
        fields: ["hash", "key", "metadata", "createdAt", "updatedAt"],
        idField: ["hash"]
      },
      // Metadata
      metadata: {},
      // Dependencies
      dependencies: [],

      // adapter: provideTypeOrmAdapter<FleekTransaction>(),
      // adapter: provideTypeOrmAdapter<FleekTransaction>("ipfs"),

      // model: FleekTransaction,

      // mixins: [DbService],

      fields: ["hash", "key", "modelType", "metadata", "createdAt", "updatedAt"],
      idField: ["hash"],

      actions: {
        store: {
          params: {
            key: { type: "string" },
            data: { type: "class", instanceOf: Buffer },
            metadata: {
              type: "object",
              strict: false,
              props: {
                fileSize: { type: "number", positive: true, integer: true },
                mimeType: { type: "string", value: "application/json" },
                requestId: { type: "string" }
              }
            }
          } as ActionParams,
          visibility: "public",
          async handler(
            this: IPFSService,
            context: Context<IIPFS.StoreParams, IIPFSServiceMeta>
          ): Promise<IIPFS.StoreResponse> {
            // return Promise.resolve({ key: "", hash: "" })
            const result = await this.operation.store(context)

            if (result.isOk()) {
              return result.value
            } else {
              throw result.error
            }
          }
        }
      },

      // Service methods
      async started(this: IPFSService) {
        this.logger.info("Start ipfs service")
        // await connectionInstance()
        return Promise.resolve()
      },

      async stopped() {
        // return await getConnection().close()
        return Promise.resolve()
      }

      // afterConnected(this: IPFSService) {
      //   this.logger.info("Connected successfully")
      //   return this.adapter.clear()
      // }
    })
  }

  // async upload(this: IPFSService, { params, requestId }: { params: MfivEvent; requestId: string }) {
  //   const jsonString = JSON.stringify(params)
  //   const ctx = params.context
  //   const mfivParams = params.params

  //   this.logger.debug("${ctx.methodology}.${ctx.windowInterval}.${ctx.currency}.index.created", jsonString)
  //   // const key = `mf4.7d.ETH.DBO.
  //   // const key = `/estimates/methodology=mfiv/interval=14d/currency=ETH/exchange=deribit/instrument=option/ts=2022-01-01T00:05:00.000Z/mf4.14d.json`
  //   // eslint-disable-next-line max-len
  //   const data = Buffer.from(jsonString)

  //   const uploadResult = await this.writeIPFS(key, data)
  //   this.logger.info("ipfs.upload", { key, uploadResult })

  //   if (uploadResult.isOk()) {
  //     this.logger.info("upload complete.")
  //     const result = uploadResult.value
  //     // this.logger.warn("TODO: persist to db")
  //     const model = new FleekTransaction()
  //     model.hash = result.hash
  //     model.modelType = params.metadata["uma.priceId"]
  //     model.key = result.key
  //     model.metadata = { fileSize: data.byteLength, mimeType: "application/json", transactionId: requestId }

  //     const out = await this.adapter.repository.save(model)

  //     // const out = await this.adapter.getRepository(FleekTransaction).save(model)

  //     // this.logger.info("adapter", this.adapter)
  //     // const out = await getRepository(FleekTransaction).save(model)
  //     this.logger.info("save", out)
  //     // return getRepository(User).findOne(userId);
  //     // return this.adapter.repository.save(model)
  //     // this.adapter.insert({ version, eventType, methodology, mfivcontext, mfivparams, mfivresult })
  //     //
  //   } else {
  //     this.logger.error(uploadResult)
  //     this.logger.warn("TODO: Move to top-level error handler")
  //     throw uploadResult
  //   }
  // }

  private get repository(): Repository<FleekTransaction> {
    return getConnection("default").getRepository(FleekTransaction)
  }

  private get operation() {
    return {
      store: this.store.bind(this)
      //persist: this.persist.bind(this)
    }
  }

  private async store(this: IPFSService, context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    return ResultAsync.fromPromise(fleek(context.params), handleError)
      .map(this.buildResource(context).bind(this))
      .map(resource => {
        this.logger.info("fleek resource", resource)
        return resource
      })
    //.map(this.persist.bind(this))
  }

  private buildResource(context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    const resource = new FleekTransaction()
    return (output: FleekResponse) => {
      resource.hash = output.hash
      resource.key = output.publicUrl
      return resource
    }
  }

  private persist(this: IPFSService, resource: FleekTransaction) {
    return this.repository.save(resource)
  }

  // private buildParams(this: IPFSService, context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
  //   return this.serializeData(context.params).map(params => {
  //     // Store the file size in locals for populating metadata later
  //     context.locals.fileSize = params.data.byteLength

  //     return context.params
  //   })
  // }

  // private serializeData(params: IIPFS.StoreParams) {
  //   const safeJsonStringify = Result.fromThrowable(JSON.stringify, handleError)
  //   return safeJsonStringify(params)
  //     .map(str => Buffer.from(str))
  //     .map(data => ({
  //       params,
  //       data
  //     }))
  // }
}

// events: {
//   "mfiv.*.ETH.index.created": {
//     // ${ctx.methodology}.${ctx.windowInterval}.${ctx.currency}.index.created
//     async handler(this: IPFSService, context: Context<MfivEvent>) {
//       this.logger.debug("upload", context.params)
//       const result = await this.upload({
//         params: context.params,
//         requestId: context.requestID ?? this.broker.generateUid()
//       })
//       this.logger.debug("upload", result)
//     }
//   }
// },
