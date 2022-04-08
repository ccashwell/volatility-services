const nodeEnv = process.env.NODE_ENV ?? "test"
const host = process.env.POSTGRESQL_HOST || process.env.POSTGRES_HOST || process.env.PG_HOST || "localhost"
const type = process.env.DATASOURCE_TYPE || (host.includes("amazonaws.com") ? "postgres" : "postgres")

const config = (name = "default") => {
  return {
    type,
    name,
    host,
    port: process.env.POSTGRESQL_PORT || 5432,
    username: process.env.POSTGRESQL_USERNAME || "volatility",
    password: process.env.POSTGRESQL_PASSWORD || "supersecretpassword",
    logging: process.env.TYPEORM_LOGGING || false,
    database: process.env.POSTGRESQL_DATABASE || `volatility_${nodeEnv}`,
    // entities: ["./src/entities/**/*.ts"],
    entities: process.env.TYPEORM_ENTITIES || [
      "./src/entities/fleek_transaction.ts",
      "./src/entities/methodology_index.ts",
      "./src/entities/rate.ts",
      "./src/entities/trade_pair.ts"
    ],

    migrations: ["./src/migrations/**/*.ts"],
    subscribers: ["./src/subscribers/**/*.ts"],
    cli: {
      entitiesDir: "./src/entities",
      migrationsDir: "./src/migrations",
      subscribersDir: "./src/subscribers"
    },
    synchronize: true
  }
}

export default config
