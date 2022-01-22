import { Stream } from "stream"
import { ResultAsync } from "neverthrow"
import fleekStorage, { uploadOutput } from "@fleekhq/fleek-storage-js"
import secrets from "../lib/utils/secrets"
import { fleekUploadFailure } from "../lib/errors"

export type FleekResponse = uploadOutput

type Bufferable = string | Buffer | Stream | Blob
export type FleekUploadable = Bufferable | Bufferable[]

/**
 * Upload data to IPFS.
 *
 * @param key - the filename to same on IPFS
 * @param data - FleekUploadable data to store on IPFS
 * @returns FleekResponse containing the IPFS hash
 *
 * @throws {@link Failure<VGError.FleekUploadFailure>}
 */
const upload = async <T extends FleekUploadable>(key: string, data: T) => {
  const cfg = await fleekConfig
  return await ResultAsync.fromPromise(fleekStorage.upload({ ...cfg, data, key }), err =>
    fleekUploadFailure(err as Error)
  )
}

const fleekConfig = (async () => {
  const secretsJson = await secrets()

  if (!secretsJson.FLEEK_ID) {
    throw new Error("FLEEK_ID must be set. Check value in secrets manager.")
  }

  if (!secretsJson.FLEEK_SECRET) {
    throw new Error("FLEEK_SECRET must be set. Check value in secrets manager.")
  }

  return {
    apiKey: secretsJson.FLEEK_ID,
    apiSecret: secretsJson.FLEEK_SECRET
  }
})()

export default {
  upload
}
