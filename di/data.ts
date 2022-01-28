import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"

export const provideTypeOrmAdapter = <T>(named: string) =>
  new TypeOrmDbAdapter<T>({
    name: named,
    applicationName: process.env.APP_NAME ?? "volatility-mfiv",
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT ?? "6432", 10),
    type: "postgres"
  })
