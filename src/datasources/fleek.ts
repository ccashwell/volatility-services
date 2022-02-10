import { upload as fleekUpload, uploadOutput } from "@fleekhq/fleek-storage-js"
import { Bufferable } from "@datasources/types"
import { IpfsClientConfig } from "@clients/types"

export type IpfsUploadable = Bufferable | Bufferable[]

/**
 * Provide the fleekjs client upload method as a curried function
 *
 * @param - IpfsClientConfig object for fleek bucket, fleek apiKey, fleek apiSecret
 * @returns Promise<uploadOutput>
 */
export const provideFleekUpload =
  (config: IpfsClientConfig) =>
  async (key: string, data: Bufferable): Promise<uploadOutput> =>
    fleekUpload({
      key,
      data,
      ...config
      // bucket,
      // apiKey,
      // apiSecret
    })
