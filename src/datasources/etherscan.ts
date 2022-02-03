import axios from "axios"
import { AbiItem } from "web3-utils"
import { ResultAsync } from "neverthrow"
import secrets, { Secrets } from "@lib/utils/secrets"
import { configurationError } from "@lib/errors"
import { handleError } from "@lib/handlers/errors"

/**
 * Bootstrap the fleek client
 *
 * @param secretsJson - config object that provides credentials to the underlying clients
 * @returns client object with an upload method
 */
const clientConfig = (secretsJson: Secrets) => () => {
  if (!secretsJson.ETHERSCAN_API_KEY) {
    throw configurationError("ETHERSCAN_API_KEY", undefined)
  }

  return {
    etherscanKey: secretsJson.ETHERSCAN_API_KEY || ""
  }
}

type LoadSecretsFn = typeof secrets

const provideAddressUrl = (apiKey: string) => (address: string) =>
  `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
type UrlProvider = typeof provideAddressUrl

export const newClient = (secretsFn: LoadSecretsFn, urlProvider: UrlProvider) => async (address: string) => {
  const secretsJson = await secretsFn()
  const env = clientConfig(secretsJson)()
  const addressUrlProvider = urlProvider(env.etherscanKey)

  console.log(addressUrlProvider(address))
  return ResultAsync.fromPromise(
    axios
      .post(addressUrlProvider(address))
      .then(response => response.data as { status: string; message: string; result: string })
      .then(response => {
        const { status, message, result } = response
        return {
          status,
          message,
          result: JSON.parse(result) as AbiItem | AbiItem[]
        } as { status: string; message: string; result: AbiItem | AbiItem[] }
      }),
    handleError
  )
}

export default newClient(secrets, provideAddressUrl)
