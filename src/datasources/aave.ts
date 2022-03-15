import { DefaultClient as SecretsClient } from "@clients/secrets_client"
import { AAVE } from "@contracts/known_addresses"
import { provideEtherscan as etherscan } from "@datasources/etherscan"
import { IRate } from "@interfaces"
import C from "@lib/constants"
import { handleAsMoleculerError } from "@lib/handlers/errors"
import { ErrorType } from "@lib/types"
import { Result, ResultAsync } from "neverthrow"
import Web3 from "web3"
import { HttpProvider } from "web3-core"
import { AbiItem } from "web3-utils"

const aaveReserve = Web3.utils.toChecksumAddress(AAVE.LendingPoolV2)

/**
 * Bootstrap the fleek client
 *
 * @param secretsJson - config object that provides credentials to the underlying clients
 * @returns client object with an upload method
 */

type AbiClient = (
  address: string
) => Promise<Result<{ status: string; message: string; result: AbiItem | AbiItem[] }, ErrorType>>

/**
 * Get a web3 http provider
 *
 * @param url - string to web3 provider endpoint
 * @returns Web3.Providers.HttpProvider
 */
const provideWeb3HttpProvider = (url: string) => new Web3.providers.HttpProvider(url)
/**
 * Get a web3 http provider tied to an Infura project
 *
 * @remark It should be noted that we are hardcoding this for mainnet
 *
 * @param projectId - string representing the Infura project ID
 * @returns Web3.Providers.HttpProvider for specific Infura project
 */
const provideInfuraClient = (projectId: string) => provideWeb3HttpProvider(`${C.INFURA_URI}/${projectId}`)

/**
 * Get a Web3 instance backed by an HttpProvider
 *
 * @param cfg
 * @returns
 */
const provideWeb3 = (provider: HttpProvider) => new Web3(provider)

/**
 * Instantiate the AAVE lending pool smart contract
 *
 * @param abiClient - etherscan ABI client
 * @returns Contract
 */
const provideContract = (abiClient: AbiClient) => {
  const aaveLendingPoolV2Proxy = Web3.utils.toChecksumAddress(AAVE.LendingPoolV2Proxy)

  return async (web3: Web3) => {
    const abiResult = await abiClient(AAVE.LendingPoolV2Impl)

    if (abiResult.isOk()) {
      return Result.fromThrowable(
        () => new web3.eth.Contract(abiResult.value.result, aaveLendingPoolV2Proxy),
        handleAsMoleculerError
      )()
    }

    throw handleAsMoleculerError(abiResult.error)
  }
}

/**
 * This is a web3 client capable of instantiating contracts
 */
const defaultWeb3 = () =>
  ResultAsync.fromPromise(SecretsClient().requireRead("INFURA_PROJ_ID"), handleAsMoleculerError)
    .map(hash => hash.INFURA_PROJ_ID)
    .map(provideInfuraClient)
    .map(provideWeb3)

/**
 * Read AAVE's Lending pool contract and get the liquidity rate
 *
 * @remark Read the proxy address to get the contract and inspect getReserveData
 * @remark https://etherscan.io/address/0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9
 * See https://etherscan.io/address/0xc6845a5c768bf8d7681249f8927877efda425baf#code#F8#L14
 * for an explanation on `exchangeData[3]`.
 *
 * @param web3
 * @param abiClient
 * @returns AAVE liquidation rate as a %
 */
const provideAaveLiquidityValue = () =>
  defaultWeb3()
    .map(provideContract(etherscan))
    .map(async result => {
      if (result.isOk()) {
        const contract = result.value
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const contractValues = (await contract.methods.getReserveData(aaveReserve).call()) as number[]
        return contractValues[3] // currentLiquidityRate expressed in RAY
      }
      throw result.error
    })

/**
 * @remark This conversion is specific to the LendingPool contract
 */
const toLiquidityRate = (value: number) => {
  const RAY = 10 ** 27
  return 100.0 * (value / RAY) // currentLiquidityRate expressed in RAY
}

export async function provideRateResponse() {
  const contractValue = await provideAaveLiquidityValue().unwrapOr(0)

  return {
    contractValue,
    risklessRate: toLiquidityRate(contractValue), // TODO: Return 'undefined' and let upstream handle it
    risklessRateAt: new Date().toISOString(),
    risklessRateSource: "aave"
  } as IRate.RisklessRateResponse & { contractValue: number }
}
