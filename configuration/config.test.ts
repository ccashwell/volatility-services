import { Dialect } from "sequelize/types"
import { config as _config, EnvConfig } from "./config.base"

export const config: EnvConfig = {
  ..._config,
  ...{
    db: {
      username: "mfiv_user",
      password: "At5DHGHgG$dQlCwN6q1#e*5a",
      database: "volatility_mfiv_test",
      host: "127.0.0.1",
      port: 6432,
      dialect: "postgres" as Dialect,
      dialectOptions: {
        useUTC: true
      },
      timezone: "+00:00",
      pool: {
        max: 10,
        min: 0,
        idle: 10_000
      },
      logging: console.log
    }
  }
}
