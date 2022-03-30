import { uploadInput, uploadOutput } from "@fleekhq/fleek-storage-js"
import { Stream } from "stream"
import { AbiItem } from "web3-utils"

export interface GetAbiResponse {
  data: {
    status: string
    message: string
    result: string // | AbiItem | AbiItem[]
  }
}

export interface ParsedAbiResponse {
  status: string
  message: string
  result: AbiItem | AbiItem[]
}

export type UploadResponse = uploadOutput

export type UploadParams = Omit<uploadInput, "apiKey" | "apiSecret">

export type Bufferable = string | Buffer | Stream | Blob
