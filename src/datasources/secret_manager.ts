import { SecretKey } from "@clients/types"
import * as aws from "aws-sdk"
import { AWSError, SecretsManager } from "aws-sdk"

export const FetchSecret = (secretName: string): Promise<Record<SecretKey, string>> =>
  new Promise((resolve, reject) =>
    new aws.SecretsManager({ region: "us-east-1" }).getSecretValue(
      { SecretId: secretName },
      (err: AWSError, data: SecretsManager.GetSecretValueResponse) => {
        if (err) {
          switch (err.code) {
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            case "DecryptionFailureException":
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            case "InternalServiceErrorException":
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            case "InvalidParameterException":
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            case "InvalidRequestException":
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            case "ResourceNotFoundException":
              return reject(err)
            default:
              return reject(err)
          }
        }
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if (data.SecretString === undefined) {
          throw Error(
            "The secrets manager returned an undefined string instead of a json string. Check that configuration settings are correct."
          )
        }

        return resolve(JSON.parse(data.SecretString) as Record<SecretKey, string>)
      }
    )
  )
