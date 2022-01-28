import { Stream } from "stream"
import { uploadOutput, upload as fleekUpload, uploadInput } from "@fleekhq/fleek-storage-js"
import secrets, { Secrets } from "@lib/utils/secrets"

export type FleekResponse = uploadOutput

type Bufferable = string | Buffer | Stream | Blob
export type FleekUploadable = Bufferable | Bufferable[]

/**
 * Bootstrap the fleek client
 *
 * @param cfg - config object that provides credentials to the fleek client
 * @returns client object with an upload method
 */
// const init = (cfg: ReturnType<typeof clientConfig>) => {
//   const credentials = await cfg()

//   return {
//     /**
//      * Upload data to IPFS.
//      *
//      * @param key - the filename to same on IPFS
//      * @param data - FleekUploadable data to store on IPFS
//      * @returns FleekResponse containing the IPFS hash
//      *
//      * @throws {@link Failure<VGError.FleekUploadFailure>}
//      */
//     upload: async (params: Omit<uploadInput, "apiKey" | "apiSecret">) =>
//       fleekUpload({
//         ...credentials,
//         ...params
//       })
//   }
// }

// const upload = (client: fleekStorage, cfg: ) => ()
// (fleek, params): Promise<uploadOutput> =>
// (key: string, data: T) => {}
// const upload = async <T extends FleekUploadable>(key: string, data: T) => {
//   const cfg = await fleekConfig
//   return ResultAsync.fromPromise(fleekStorage.upload({ ...cfg, data, key }), err => fleekUploadFailure(err as Error))
// }

// const clientConfig = (secretsClient: () => Promise<Secrets>) => async () => {
//   const secretsJson = await secretsClient()

//   if (!secretsJson.FLEEK_ID) {
//     throw new Error("FLEEK_ID must be set. Check value in secrets manager.")
//   }

//   if (!secretsJson.FLEEK_SECRET) {
//     throw new Error("FLEEK_SECRET must be set. Check value in secrets manager.")
//   }

//   return {
//     apiKey: secretsJson.FLEEK_ID,
//     apiSecret: secretsJson.FLEEK_SECRET,
//     bucket: process.env.FLEEK_BUCKET ?? "volatilitycom-bucket"
//   }
// }

const clientConfig2 = (secretsJson: Secrets) => () => {
  if (!secretsJson.FLEEK_ID) {
    throw new Error("FLEEK_ID must be set. Check value in secrets manager.")
  }

  if (!secretsJson.FLEEK_SECRET) {
    throw new Error("FLEEK_SECRET must be set. Check value in secrets manager.")
  }

  return {
    apiKey: secretsJson.FLEEK_ID,
    apiSecret: secretsJson.FLEEK_SECRET,
    bucket: process.env.FLEEK_BUCKET ?? "volatilitycom-bucket"
  }
}

type UploadFn = typeof fleekUpload
type LoadSecretsFn = typeof secrets

const newClient =
  (secrets2: LoadSecretsFn, fn: UploadFn) => async (params: Omit<uploadInput, "apiKey" | "apiSecret">) => {
    const secretsJson = await secrets2()
    const env = clientConfig2(secretsJson)()

    return await fn({ ...env, ...params })
    // return {
    //   upload: await fn({ ...env, ...params })
    //   // await fn({
    //   //   ...env,
    //   //   ...p2
    //   // })
    // }
    // return {
    //   upload: (p2: Omit<uploadInput, "apiKey" | "apiSecret">) => {
    //     upload2({
    //       ...env(),
    //       ...p2
    //     })
    //   }
    // }
  }

export default newClient(secrets, fleekUpload)
// const uploadFile =
// const fleekSecrets = clientConfig(secrets)
// const fleekConfig = (async () => {
//   const secretsJson = await secrets().catch(err => {
//     throw err
//   })

//   if (!secretsJson.FLEEK_ID) {
//     throw new Error("FLEEK_ID must be set. Check value in secrets manager.")
//   }

//   if (!secretsJson.FLEEK_SECRET) {
//     throw new Error("FLEEK_SECRET must be set. Check value in secrets manager.")
//   }

//   return {
//     apiKey: secretsJson.FLEEK_ID,
//     apiSecret: secretsJson.FLEEK_SECRET
//   }
// })()

// ;(async () => {
//   const c = await client(clientConfig(secrets))
// })().catch(e => {
//   throw e
// })
// export default defaultClient
// let client: ReturnType<typeof init>

// try {
//   const client = await init(clientConfig(secrets))
// } catch (e: unknown) {
//   throw e
// }
