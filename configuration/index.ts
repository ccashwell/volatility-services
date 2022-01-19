import { config as testConfig } from "./config.test"
import { config as devConfig } from "./config.development"
import { config as prodConfig } from "./config.production"
import { EnvConfig } from "./config.base"

const env = process.env.NODE_ENV ?? "development"
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
