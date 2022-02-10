import { AWSError } from "aws-sdk"
import { Errors } from "moleculer"
import { SecretKey } from "@clients/types"

export class SecretClientError extends Errors.MoleculerClientError {
  constructor(secretName: string, propertyName: string, err: AWSError | Error | undefined = undefined) {
    const data = err === undefined ? undefined : { wrapped: err }

    super("AWS Secret Manager Error", 500, "VG_ENVIRONMENT_CONFIG_ERROR", data)
  }

  static from(secretName: string, err: Error, ...args: SecretKey[]) {
    return new SecretClientError(secretName, args.join(", "), err as AWSError | Error)
  }
}
