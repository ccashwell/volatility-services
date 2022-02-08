import "reflect-metadata"
import { EnvConfig } from "./config.base"
import { config as testConfig } from "./config.test"
import { config as devConfig } from "./config.development"
import { config as prodConfig } from "./config.production"

const env = process.env.NODE_ENV as string

let envConfig: EnvConfig

if (env === "test") {
  envConfig = testConfig
} else if (env === "development") {
  envConfig = devConfig
} else if (env === "production") {
  envConfig = prodConfig
} else {
  throw Error("NODE_ENV must be set.")
}

export default envConfig
