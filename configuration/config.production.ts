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
      username: process.env.PG_USERNAME as string,
      password: process.env.PG_PASSWORD as string,
      database: process.env.PG_DATABASE as string,
      host: process.env.PG_HOST as string,
      port: parseInt(process.env.PG_PORT as string, 10),
      // dialect: "postgres" as Dialect,
      // dialectOptions: {
      //   useUTC: true
      // },
      // timezone: "+00:00",
      // pool: {
      //   max: parseInt(process.env.PG_POOL_MAX as string, 10) ?? 10,
      //   min: parseInt(process.env.PG_POOL_MIN as string, 10) ?? 0,
      //   idle: parseInt(process.env.PG_POOL_IDLE as string, 10) ?? 10_000
      // },
      logging: undefined
    }
  }
}
