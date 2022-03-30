const nodeEnv = process.env.NODE_ENV ?? "test"
const host = process.env.POSTGRESQL_HOST || process.env.POSTGRES_HOST || process.env.PG_HOST || "localhost"
const type = process.env.DATASOURCE_TYPE || (host.includes("amazonaws.com") ? "postgres" : "postgres")

export default {
  type,
  name: process.env.DATASOURCE_NAME || "default",
  host,
  port: process.env.POSTGRESQL_PORT || 5432,
  username: process.env.POSTGRESQL_USERNAME || "volatility",
  password: process.env.POSTGRESQL_PASSWORD || "supersecretpassword", // "i4EYumRSwTJltme",
  logging: process.env.TYPEORM_LOGGING || false,
  database: `volatility_${nodeEnv}`,
  entities: ["./src/entities/**/*.ts"],
  migrations: ["./src/migrations/**/*.ts"],
  subscribers: ["./src/subscribers/**/*.ts"],
  cli: {
    entitiesDir: "./src/entities",
    migrationsDir: "./src/migrations",
    subscribersDir: "./src/subscribers"
  },
  synchronize: true
}
