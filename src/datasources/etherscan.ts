import axios from "axios"
import { AbiItem } from "web3-utils"
import { ResultAsync } from "neverthrow"
import { GetAbiResponse, ParsedAbiResponse } from "./types"
import { DefaultClient as SecretsClient } from "@clients/secrets_client"
import { handleAsMoleculerError } from "@lib/handlers/errors"

const provideAddressUrl = (apiKey: string) => (address: string) =>
  `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`

const transformAbiResponseResult = (response: GetAbiResponse): ParsedAbiResponse => {
  const { result, ...rest } = response.data
  const abi = JSON.parse(result) as AbiItem | AbiItem[]

  return {
    ...rest,
    result: abi
  }
}

const fetchContractFromAbiProvider = (address: string) =>
  axios.post<unknown, GetAbiResponse>(address).then(transformAbiResponseResult)

export const provideEtherscan = async (address: string) =>
  ResultAsync.fromPromise(SecretsClient().requireRead("ETHERSCAN_API_KEY"), handleAsMoleculerError)
    .map(secrets => secrets.ETHERSCAN_API_KEY)
    .map(provideAddressUrl)
    .map(provider => provider(address))
    .map(fetchContractFromAbiProvider)
