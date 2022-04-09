/* eslint-disable prettier/prettier */
// prettier-ignore
import "reflect-metadata"
import { MethodologyIndex, Rate, AuthToken, TradePair } from "@entities"
import { DataSource, LoggerOptions } from "typeorm"
// import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"
// import OrmConfig from "../../ormconfig"
// export const AppDataSourceFactory = (name: string) => new DataSource(OrmConfig(name) as PostgresConnectionOptions)

const nodeEnv = process.env.NODE_ENV ?? "test"
const host = process.env.POSTGRESQL_HOST || process.env.POSTGRES_HOST || process.env.PG_HOST || "localhost"
// const type = process.env.DATASOURCE_TYPE || (host.includes("amazonaws.com") ? "postgres" : "postgres")

export const AppDataSource = new DataSource({
  type: "postgres",
  host,
  port: +(process.env.POSTGRESQL_PORT || 5432),
  username: process.env.POSTGRESQL_USERNAME || "volatility",
  password: process.env.POSTGRESQL_PASSWORD || "supersecretpassword",
  logging: (process.env.TYPEORM_LOGGING || false) as LoggerOptions,
  database: process.env.POSTGRESQL_DATABASE || `volatility_${nodeEnv}`,
  synchronize: true,
  entities: [TradePair, Rate, MethodologyIndex, AuthToken],
  migrations: [],
  subscribers: []
})
