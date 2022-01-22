import { Dialect } from "sequelize"
import { Exchange } from "tardis-dev"
import sequelizeConnection from "../datasources/database"
interface AwsConfig {
  region: string
  smName: string
}

interface TardisConfig {
  exchange: string
  waitWhenDataNotYetAvailable: boolean
}

export interface EnvConfig {
  aws: AwsConfig
  tardis: TardisConfig
  mfiv: {
    exchange: Exchange
    baseCurrency: "ETH"
    interval: "14d"
    methodology: "mfiv"
    symbolType: "option"
  }
  db?: {
    username: string
    password: string
    database: string
    host: string
    port: number
    dialect: Dialect
    dialectOptions: {
      useUTC: true
    }
    timezone: "+00:00"
    pool: {
      max: number
      min: number
      idle: number
    }
    logging?: (message: any, ...optionalParams: any[]) => void
  }
}

export const config: EnvConfig = {
  aws: {
    region: "us-east-1",
    smName: "API_Keys"
  },
  tardis: {
    exchange: process.env.EXCHANGE ?? "deribit",
    waitWhenDataNotYetAvailable: true
  },
  mfiv: {
    exchange: (process.env.EXCHANGE ?? "deribit") as Exchange,
    baseCurrency: (process.env.BASE_CURRENCY ?? "ETH") as "ETH",
    interval: "14d",
    methodology: "mfiv",
    symbolType: "option"
  }
}
