import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities"
import { IIndex } from "@interfaces"
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
  cronSettings: {
    estimate: Omit<IIndex.EstimateParams, "at">
  }
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
  cronSettings: {
    estimate: {
      exchange: (process.env.EXCHANGE as MethodologyExchangeEnum) ?? MethodologyExchangeEnum.Deribit,
      methodology: (process.env.METHODOLOGY as MethodologyEnum) ?? MethodologyEnum.MFIV,
      baseCurrency: (process.env.BASE_CURRENCY as BaseCurrencyEnum) ?? BaseCurrencyEnum.ETH,
      interval: (process.env.INTERVAL as MethodologyWindowEnum) ?? MethodologyWindowEnum.Day14,
      symbolType: (process.env.INSTRUMENT as SymbolTypeEnum) ?? SymbolTypeEnum.Option,
      expiryType: (process.env.EXPIRY_TYPE as MethodologyExpiryEnum) ?? MethodologyExpiryEnum.FridayT08,
      contractType: ["call_option", "put_option"]
    }
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
