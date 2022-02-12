export default {
  type: "postgres",
  host: process.env.POSTGRES_HOST ?? "0.0.0.0",
  port: 5432,
  synchronize: true,
  logging: false,
  username: "postgres",
  password: "postgres",
  name: "default",
  database: "volatility_development",
  entities: ["./src/entities/**/*.ts"],
  migrations: ["./src/migrations/**/*.ts"],
  subscribers: ["./src/subscribers/**/*.ts"],
  cli: {
    entitiesDir: "./src/entities",
    migrationsDir: "./src/migrations",
    subscribersDir: "./src/subscribers"
  }
}
