import { uploadInput } from "@fleekhq/fleek-storage-js"
import { UploadResponse } from "@datasources/types"

export declare const SECRETKEYS: readonly [
  "TARDIS_API_KEY",
  "ETHERSCAN_API_KEY",
  "FLEEK_ID",
  "FLEEK_SECRET",
  "INFURA_PROJ_ID"
]

export type SecretKey = typeof SECRETKEYS[number]

export interface SecretClient {
  requireRead(...args: SecretKey[]): Promise<Record<SecretKey, string>>
}

export interface IpfsClientConfig {
  bucket: string
  apiKey: string
  apiSecret: string
}

export interface IpfsClient {
  upload(params: UploadParams): Promise<UploadResponse>
}

// export type IpfsUploadable = Bufferable | Bufferable[]
export type UploadParams = Omit<uploadInput, "apiKey" | "apiSecret">
