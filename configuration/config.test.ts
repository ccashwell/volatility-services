import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
import { config as _config, EnvConfig } from "./config.base"

export const config: EnvConfig = {
  ..._config,
  ...{
    db: {
      username: "mfiv_user",
      password: "At5DHGHgG$dQlCwN6q1#e*5a",
      database: "volatility_test",
      host: "127.0.0.1",
      port: 6432,
      logging: console.log
    }
  }
}
