import { NormalizedExchange } from "@lib/types"
import { Exchange } from "tardis-dev"

interface AwsConfig {
  region: string
  smName: string
}

interface TardisConfig {
  exchange: Exchange & NormalizedExchange
  waitWhenDataNotYetAvailable: number | boolean | undefined
}

export interface EnvConfig {
  adapter: {
    type: "postgres"
    name: string
    host: string
    username: string
    password: string
    database: string
    port: number
    entities: string[]
    synchronize: boolean
  }
  aws: AwsConfig
  // clients?: {
  //   secretsManager: ISecretsManager
  // }
  // db?: {
  //   username: string
  //   password: string
  //   database: string
  //   host: string
  //   port: number
  //   logging?: (message: any, ...optionalParams: any[]) => void
  // }
  indexSettings: {
    risklessRate: number
    risklessRateAt: string
    risklessRateSource: string
  }
  tardis: TardisConfig
}

export const config: EnvConfig = {
  adapter: {
    type: "postgres",
    name: "default",
    database: process.env.POSTGRES_DB as string,
    entities: ["./src/entities/fleek_transaction.ts", "./src/entities/methodology_index.ts", "./src/entities/rate.ts"],
    // entities: [__dirname + "/*"],
    port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
    host: process.env.POSTGRES_HOST as string,
    username: process.env.POSTGRES_USER as string,
    password: process.env.POSTGRES_PASSWORD as string,
    synchronize: true
  },
  aws: {
    region: process.env.AWS_REGION ?? "us-east-2",
    smName: "API_Keys"
  },
  indexSettings: {
    risklessRate: parseFloat(process.env.RISKLESS_RATE ?? "0.0055"),
    risklessRateAt: process.env.RISKLESS_RATE_AT ?? "2021-10-01T07:02:00.000Z",
    risklessRateSource: process.env.RISKLESS_RATE_SOURCE ?? "aave"
  },

  tardis: {
    exchange: (process.env.EXCHANGE ?? "deribit") as Exchange & NormalizedExchange,
    waitWhenDataNotYetAvailable: true
  }
}
