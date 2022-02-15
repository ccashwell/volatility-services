import { config as _config, EnvConfig } from "./config.base"
// import { ISecretsManager } from "@clients/types"

export const config: EnvConfig = {
  ..._config,
  ...{
    // db: {
    //   username: process.env.POSTGRES_USER as string,
    //   password: process.env.POSTGRES_PASSWORD as string,
    //   database: process.env.POSTGRES_DB as string,
    //   host: process.env.POSTGRES_HOST as string,
    //   port: parseInt(process.env.POSTGRES_PORT as string, 10),
    //   logging: undefined
    // }
  }
}
