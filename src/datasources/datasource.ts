import "tsconfig-paths/register"
import { DataSource, LoggerOptions } from "typeorm"
import { AuthToken, FleekTransaction, MethodologyIndex, MfivIndex, Rate, TradeOption, TradePair } from "../entities"

const nodeEnv = process.env.NODE_ENV ?? "test"
const host = process.env.POSTGRESQL_HOST || process.env.POSTGRES_HOST || process.env.PG_HOST || "localhost"
// const type = process.env.DATASOURCE_TYPE || (host.includes("amazonaws.com") ? "postgres" : "postgres")

export const AppDataSource: DataSource = new DataSource({
  type: "postgres",
  host,
  port: +(process.env.POSTGRESQL_PORT || 5432),
  username: process.env.POSTGRESQL_USERNAME || "volatility",
  password: process.env.POSTGRESQL_PASSWORD || "supersecretpassword",
  logging: (process.env.TYPEORM_LOGGING || false) as LoggerOptions,
  database: process.env.POSTGRESQL_DATABASE || `volatility_${nodeEnv}`,
  synchronize: process.env.NODE_ENV === "production" || process.env.TYPEORM_SYNCRONIZE === "false" ? false : true,
  entities: [TradeOption, TradePair, Rate, MethodologyIndex, AuthToken, FleekTransaction, MfivIndex],
  migrations: ["src/migrations/*.ts"],
  subscribers: []
})
