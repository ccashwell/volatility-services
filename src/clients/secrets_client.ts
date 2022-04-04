import { SecretClientError } from "@lib/errors/secret_error"
import * as _ from "lodash"
import { SecretClient, SecretKey } from "./types"

export interface ClientConfig {
  secretName: string
}

/**
 * Return a client that can read secrets.
 *
 * @remark the current implementation reads AWS SecretManager["API_Keys"]
 * This can be overridden by setting `AWS_SM_SECRET_NAME` in the environment
 *
 */
export const DefaultClient = ({ secretName }: ClientConfig = { secretName: "API_Keys" }): SecretClient => {
  const secretManagerSecretName = process.env.AWS_SECRET_MANAGER_SECRET_NAME ?? secretName

  // TODO: Need to figure out why the ECS task can't use secretsmanager calls here
  // const dataSource = FetchSecret(secretManagerSecretName)
  const dataSource = Promise.resolve({
    TARDIS_API_KEY: process.env.TARDIS_API_KEY,
    INFURA_PROJ_ID: process.env.INFURA_PROJ_ID,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
    FLEEK_ID: "",
    FLEEK_SECRET: ""
  } as Record<SecretKey, string>)

  return new PrivateClient(dataSource, { secretName: secretManagerSecretName })
}

class PrivateClient implements SecretClient {
  constructor(private dataSource: Promise<Record<SecretKey, string>>, private options: ClientConfig) {}

  requireRead(...args: SecretKey[]): Promise<Record<SecretKey, string>> {
    return this.dataSource
      .then(secrets => _.pick(secrets, args))
      .catch(err => Promise.reject(SecretClientError.from(this.options.secretName, err as Error, ...args)))
  }
}
