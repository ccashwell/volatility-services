import { IpfsClientConfig, UploadParams } from "./types"
import { DefaultClient as SecretsClient } from "./secrets_client"
import { provideFleekUpload } from "@datasources/fleek"

export default {
  DefaultClient: (cfg: IpfsClientConfig) => provideFleekUpload(cfg),
  AsyncDefaultClient: (bucket: string) => async (params: UploadParams) => {
    const secretsClient = SecretsClient()
    const credentials = await secretsClient.requireRead("FLEEK_ID", "FLEEK_SECRET")
    return provideFleekUpload({ bucket, apiKey: credentials.FLEEK_ID, apiSecret: credentials.FLEEK_SECRET })
  }
}
// export const DefaultClient = (cfg: IpfsClientConfig) => provideFleekUpload(cfg)

// export const AsyncDefaultClient = (bucket: string) => async (params: UploadParams) => {
//   const secretsClient = SecretsClient()
//   const credentials = await secretsClient.requireRead("FLEEK_ID", "FLEEK_SECRET")
//   return provideFleekUpload({ bucket, apiKey: credentials.FLEEK_ID, apiSecret: credentials.FLEEK_SECRET })
// }
