import { Exchange } from "tardis-dev"

interface AwsConfig {
  region: string
  smName: string
}

interface TardisConfig {
  exchange: Exchange
  waitWhenDataNotYetAvailable: boolean
}

export interface EnvConfig {
  aws: AwsConfig
  tardis: TardisConfig
  mfiv: {
    dbConnection: string
    exchange: Exchange
    baseCurrency: "ETH"
    interval: "14d"
  }
}

export const config: EnvConfig = {
  aws: {
    region: "us-east-1",
    smName: "API_Keys"
  },
  tardis: {
    exchange: (process.env.EXCHANGE ?? "deribit") as Exchange,
    waitWhenDataNotYetAvailable: true
  },
  mfiv: {
    dbConnection: "",
    exchange: (process.env.EXCHANGE ?? "deribit") as Exchange,
    baseCurrency: (process.env.BASE_CURRENCY ?? "deribit") as "ETH",
    interval: "14d"
    // dbConnection: `postgres://${process.env.POSTGRES_USER ?? "postgres"}:${
    //   process.env.POSTGRES_PASSWORD ?? "postgres"
    // }@${process.env.POSTGRES_HOST ?? "localhost"}:${process.env.POSTGRES_PORT ?? 5432}/${
    //   process.env.DB_NAME ?? "methodology"
    // }`
  }
}
