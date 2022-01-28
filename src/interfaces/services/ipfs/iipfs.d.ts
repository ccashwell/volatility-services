export interface StoreParams {
  key: string
  data: Buffer
  metadata: {
    fileSize: number
    mimeType: string
    requestId: string
  }
}

export interface StoreResponse {
  hash: string
  key: string
}
