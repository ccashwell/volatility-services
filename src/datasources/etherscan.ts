import { DefaultClient as SecretsClient } from "@clients/secrets_client"
import C from "@lib/constants"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import axios from "axios"
import { ResultAsync } from "neverthrow"
import { AbiItem } from "web3-utils"
import { GetAbiResponse, ParsedAbiResponse } from "./types"

const provideAddressUrl = (apiKey: string) => (address: string) =>
  `${C.ETHERSCAN_API_URI}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`

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
