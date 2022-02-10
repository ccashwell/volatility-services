/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  globals: {
    "ts-jest": {
      // ts-jest configuration goes here
      tsconfig: "./test/tsconfig.test.json",
    },
  },
  testPathIgnorePatterns: [
    "<rootDir>/configuration/config.test.ts"
  ],
  moduleNameMapper: {
    "^@configuration$": "<rootDir>/configuration",
    "^@clients/(.*)$": "<rootDir>/src/clients/$1",
    "^@clients$": "<rootDir>/src/clients",
    "^@datasources$": "<rootDir>/src/datasources",
    "^@datasources/(.*)$": "<rootDir>/src/datasources/$1",
    "^@entities$": "<rootDir>/src/entities",
    "^@secrets^": "<rootDir>/test/config/secrets",
    "^@entities/connection$": "<rootDir>/test/config/connection",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@repositories/(.*)$": "<rootDir>/src/repositories/$1",
    "^@service_helpers$": "<rootDir>/src/service_helpers",
    "^@service_helpers/(.*)$": "<rootDir>/src/service_helpers/$1",
    "^@services/(.*)$": "<rootDir>/services",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1"
  }
}
