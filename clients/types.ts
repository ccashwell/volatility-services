import { AWSError, Request, SecretsManager } from "aws-sdk"

type GetSecretValueFn = (
  params: SecretsManager.Types.GetSecretValueRequest,
  callback?: (err: AWSError, data: SecretsManager.Types.GetSecretValueResponse) => void
) => Request<SecretsManager.Types.GetSecretValueResponse, AWSError>

export interface ISecretsManager {
  getSecretValue: GetSecretValueFn
}
