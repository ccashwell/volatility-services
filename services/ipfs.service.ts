"use strict"

import * as DbAdapter from "moleculer-db"
import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"

import { ActionParams, Context, Service, ServiceBroker } from "moleculer"
import { Repository } from "typeorm"
import { ResultAsync } from "neverthrow"
import configuration from "../configuration"
import fleek, { FleekResponse } from "@datasources/fleek"
import { FleekTransaction } from "@entities"
import { IIPFS } from "@interfaces/services/ipfs"
import { IIPFSServiceMeta } from "@interfaces/meta"
import { handleAsMoleculerError } from "@lib/handlers/errors"

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

      adapter: new TypeOrmDbAdapter(configuration.adapter),

      model: FleekTransaction,

      mixins: [DbAdapter],

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
      // async started(this: IPFSService) {
      //   this.logger.info("Start ipfs service")
      //   // this.connection = await connectionInstance()
      // },

      // async stopped() {
      //   await this.connection.close()
      // }

      afterConnected(this: IPFSService) {
        this.logger.info("Connected successfully")
      }
    })
  }

  private get repository(): Repository<FleekTransaction> {
    return this.adapter.repository
  }

  private get operation() {
    return {
      store: this.store.bind(this)
      //persist: this.persist.bind(this)
    }
  }

  private async store(this: IPFSService, context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    return ResultAsync.fromPromise(fleek(context.params), handleAsMoleculerError)
      .map(this.buildResource(context).bind(this))
      .map(resource => {
        this.logger.info("fleek resource", resource)
        return resource
      })
      .map(this.persist.bind(this))
      .map(result => {
        console.log(result)
        return result
      })
  }

  private buildResource(context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    const resource = new FleekTransaction()
    return (output: FleekResponse) => {
      resource.hash = output.hash
      resource.key = output.publicUrl
      resource.metadata = context.params.metadata
      return resource
    }
  }

  private persist(this: IPFSService, resource: FleekTransaction) {
    return this.repository.save(resource)
  }
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
