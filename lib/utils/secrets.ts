import aws from "aws-sdk"
import config from "../../configuration"

// secret,
// decodedBinarySecret;
interface Secrets {
  [key: string]: string
}

// Create a Secrets Manager client
const client = new aws.SecretsManager({
  region: config.aws.region
})

// In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
// See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// We rethrow the exception by default.
export default async function secrets(): Promise<Secrets> {
  return new Promise(function (resolve, reject) {
    let secret: Secrets

    client.getSecretValue({ SecretId: config.aws.smName }, function (err, data) {
      if (err) {
        if (err.code === "DecryptionFailureException") {
          // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
          // Deal with the exception here, and/or rethrow at your discretion.
          reject(err)
        } else if (err.code === "InternalServiceErrorException") {
          // An error occurred on the server side.
          // Deal with the exception here, and/or rethrow at your discretion.
          reject(err)
        } else if (err.code === "InvalidParameterException") {
          // You provided an invalid value for a parameter.
          // Deal with the exception here, and/or rethrow at your discretion.
          reject(err)
        } else if (err.code === "InvalidRequestException") {
          // You provided a parameter value that is not valid for the current state of the resource.
          // Deal with the exception here, and/or rethrow at your discretion.
          reject(err)
        } else if (err.code === "ResourceNotFoundException") {
          // We can't find the resource that you asked for.
          // Deal with the exception here, and/or rethrow at your discretion.
          reject(err)
        }
      } else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ("SecretString" in data) {
          if (data.SecretString === undefined) {
            throw Error(
              "The secrets manager returned an undefined string instead of a json string. Check that configuration settings are correct."
            )
          }
          secret = JSON.parse(data.SecretString) as Secrets
        }
      }

      resolve(secret)
    })
  })
}
