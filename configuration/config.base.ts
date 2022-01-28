import Moleculer, { LogLevels } from "moleculer"
import { Exchange } from "tardis-dev"
import { ISecretsManager } from "../clients/types"
import { NormalizedExchange } from "@lib/types"
import { IIndex } from "@interfaces"
import MoleculerRetryableError = Moleculer.Errors.MoleculerRetryableError
import {
  BaseCurrencyEnum,
  MethodologyEnum,
  MethodologyExchangeEnum,
  MethodologyExpiryEnum,
  MethodologyWindowEnum,
  SymbolTypeEnum
} from "@entities"

interface AwsConfig {
  region: string
  smName: string
}

interface TardisConfig {
  exchange: Exchange & NormalizedExchange
  waitWhenDataNotYetAvailable: number | boolean | undefined
}

export interface EnvConfig {
  aws: AwsConfig
  clients?: {
    secretsManager: ISecretsManager
  }
  logLevel: Moleculer.LogLevels
  logger: Moleculer.LoggerConfig
  db?: {
    username: string
    password: string
    database: string
    host: string
    port: number
    logging?: (message: any, ...optionalParams: any[]) => void
  }
  cronSettings: {
    estimate: Omit<IIndex.EstimateParams, "at">
  }
  indexSettings: {
    risklessRate: number
    risklessRateAt: string
    risklessRateSource: string
  }
  requestTimeout: number
  retryPolicy: Moleculer.RetryPolicyOptions
  tardis: TardisConfig
}

export const config: EnvConfig = {
  aws: {
    region: process.env.AWS_REGION ?? "us-east-2",
    smName: "API_Keys"
  },
  logger: {
    type: "Log4js",
    options: {
      // Using colors on the output
      colors: true,
      // Print module names with different colors (like docker-compose for containers)
      moduleColors: true,
      // Line formatter. It can be "json", "short", "simple", "full", a `Function` or a template string like "{timestamp} {level} {nodeID}/{mod}: {msg}"
      formatter: "full",
      // Custom object printer. If not defined, it uses the `util.inspect` method.
      objectPrinter: null,
      // Auto-padding the module name in order to messages begin at the same column.
      autoPadding: true,

      log4js: {
        appenders: {
          app: { type: "file", filename: "./logs/application.log" }
        },
        categories: {
          default: { appenders: ["app"], level: "info" }
        }
      }
    }
  },
  logLevel: (process.env.LOG_LEVEL ?? "info") as LogLevels,
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
  retryPolicy: {
    // Enable feature
    enabled: false,
    // Count of retries
    retries: 5,
    // First delay in milliseconds.
    delay: 100,
    // Maximum delay in milliseconds.
    maxDelay: 1000,
    // Backoff factor for delay. 2 means exponential backoff.
    factor: 2,
    // A function to check failed requests.
    check: (err: Error) => err && err instanceof MoleculerRetryableError && !!err.retryable
  },
  requestTimeout: 10 * 1000,
  tardis: {
    exchange: (process.env.EXCHANGE ?? "deribit") as Exchange & NormalizedExchange,
    waitWhenDataNotYetAvailable: true
  }
}
