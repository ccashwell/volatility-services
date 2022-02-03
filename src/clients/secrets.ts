import { AWSError } from "aws-sdk"
import { GetSecretValueRequest, GetSecretValueResponse } from "aws-sdk/clients/secretsmanager"
import { ISecretsManager } from "./types"

/**
 * Client class for reading from the secrets manager.
 *
 * @remark The secretsClient can be mocked or a concrete implementation
 */
export class Secrets implements ISecretsManager {
  constructor(private secretsClient: ISecretsManager) {}
  getSecretValue(
    params: GetSecretValueRequest,
    callback?: ((err: AWSError, data: GetSecretValueResponse) => void) | undefined
  ) {
    return this.secretsClient.getSecretValue(params, callback)
  }
}

export default function client(config: ISecretsManager): ISecretsManager {
  return new Secrets(config)
}
