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
const clientConfig = (secretsJson: Secrets) => () => {
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
  (secretsFn: LoadSecretsFn, fn: UploadFn) => async (params: Omit<uploadInput, "apiKey" | "apiSecret">) => {
    const secretsJson = await secretsFn()
    const env = clientConfig(secretsJson)()

    return await fn({ ...env, ...params })
  }

export default newClient(secrets, fleekUpload)
