import * as _ from "underscore"
import { SecretClient, SecretKey } from "./types"
import { FetchSecret } from "@datasources/secret_manager"
import { SecretClientError } from "@lib/errors/secret_error"

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

  const dataSource = FetchSecret(secretManagerSecretName)

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