import * as aws from "aws-sdk"
import { ISecretsManager } from "../clients/types"
import { config as _config, EnvConfig } from "./config.base"

export const config: EnvConfig = {
  ..._config,
  ...{
    clients: {
      secretsManager: new aws.SecretsManager({
        region: _config.aws.region
      }) as ISecretsManager
    },
    db: {
      username: "mfiv_user",
      password: "At5DHGHgG$dQlCwN6q1#e*5a",
      database: "volatility_mfiv_development",
      host: "127.0.0.1",
      port: 6432
    }
  },
  logLevel: "info"
}
