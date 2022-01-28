import "reflect-metadata"
import { EnvConfig } from "./config.base"
// export * as testConfig from "./config.test"
// export * as devConfig from "./config.development"
// export * as prodConfig from "./config.production"

import { config as testConfig } from "./config.test"
import { config as devConfig } from "./config.development"
import { config as prodConfig } from "./config.production"
// import { BaseCurrency, ContractType, Methodology, MfivWindow, SymbolType } from "@lib/types"

const env = process.env.NODE_ENV ?? "development"

let envConfig: EnvConfig

// export interface MfivConfig {
//   exchange: Exchange
//   baseCurrency: BaseCurrency
//   interval: MfivWindow
//   methodology: Methodology
//   symbolType: SymbolType & "option"
//   contractType: ContractType[]
// }

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
