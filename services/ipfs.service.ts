/* eslint-disable max-classes-per-file */
import IpfsClient from "@clients/ipfs_client"
import { UploadResponse } from "@datasources/types"
import { FleekTransaction } from "@entities"
import { IIPFSServiceMeta } from "@interfaces/meta"
import { IIPFS } from "@interfaces/services/ipfs"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import Moleculer, { ActionParams, Context, ServiceBroker, ServiceSchema } from "moleculer"
import * as DbAdapter from "moleculer-db"
import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
import { ResultAsync } from "neverthrow"
import { getConnection } from "typeorm"
import OrmConfig from "../ormconfig"

interface IpfsSettingsSchema extends ServiceSchema {
  bucket: string
}

export default class IPFSService extends Moleculer.Service<IpfsSettingsSchema> {
  adapter!: TypeOrmDbAdapter<FleekTransaction>
  public IpfsUpload!: ReturnType<typeof IpfsClient.AsyncDefaultClient>
  private bucket!: string

  public constructor(public broker: ServiceBroker) {
    super(broker)

    // this.ipfsClient = DefaultClient()

    this.parseServiceSchema({
      // Name
      name: "ipfs",

      // Settings
      settings: {
        name: "ipfs_schema",

        fields: ["hash", "key", "metadata", "createdAt", "updatedAt"],

        idField: ["hash"],

        ipfsEnabled: false,

        bucket: process.env.FLEEK_BUCKET ?? "volatilitycom-bucket"
      },
      // Metadata
      metadata: {},
      // Dependencies
      dependencies: [],

      adapter: new TypeOrmDbAdapter<FleekTransaction>(OrmConfig),

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
            if (!this.settings.ipfsEnabled) {
              return { hash: "", key: "" }
            }

            const result = await this.operation.store(context)

            if (result.isOk()) {
              return result.value
            } else {
              throw result.error
            }
          }
        }
      },

      async started() {
        this.IpfsUpload = IpfsClient.AsyncDefaultClient(this.settings?.bucket as string)

        return Promise.resolve()
      },

      async stopped() {
        return await getConnection().close()
      }
    })
  }

  private get operation() {
    return {
      store: this.store.bind(this),
      persist: this.persist.bind(this)
    }
  }

  private async store(this: IPFSService, context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    return ResultAsync.fromPromise(this.IpfsUpload(context.params), handleAsMoleculerError)
      .map(upload => upload(context.params.key, context.params.data))
      .map(this.buildResource(context).bind(this))
      .map(ipfsResponse => ipfsResponse)
      .map(resource => {
        this.logger.info("fleek resource", resource)
        return resource
      })
      .map(this.persist.bind(this))
  }

  private buildResource(context: Context<IIPFS.StoreParams, IIPFSServiceMeta>) {
    const resource = this.adapter.repository.create()
    return (output: UploadResponse) => {
      resource.hash = output.hash
      resource.key = output.publicUrl
      resource.metadata = context.params.metadata
      return resource
    }
  }

  private persist(this: IPFSService, resource: FleekTransaction) {
    return this.adapter.repository.save(resource)
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
