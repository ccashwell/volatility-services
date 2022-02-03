/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      // ts-jest configuration goes here
    },
  },
  moduleNameMapper: {
    "^@configuration$": "<rootDir>/configuration",
    "^@datasources/(.*)$": "<rootDir>/src/datasources/$1",
    "^@entities$": "<rootDir>/src/entities",
    "^@entities/connection$": "<rootDir>/test/config/connection",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@service_helpers/(.*)$": "<rootDir>/src/service_helpers/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1"
    // "^@(jest)/(.*)$": "<rootDir>/node_modules/@jest/$2",
    // "^@(babel)/(.*)$": "<rootDir>/node_modules/@babel/$2",
    // "^@(test)(.*)$": "<rootDir>/test/$2",
    // "^@lib/handlers/errors$": "<rootDir>/lib/handlers/errors",
    // "^@lib/errors$": "<rootDir>/lib/errors",
    // "^@lib/expiries$": "<rootDir>/lib/expiries",
    // "^@lib/utils/secrets$": "<rootDir>/lib/utils/secrets",
    // "^@entities/connection$": "<rootDir>/test/config/connection",
    // "^@entities": "<rootDir>/src/entities",
    // "^@fleekhq/fleek-storage-js$": "<rootDir>/node_modules/@fleekhq/fleek-storage-js",
    // "^@seald-io/([a-z].*)$": "<rootDir>/node_modules/@seald-io/$1",
    // "^@([a-z].*)$": "<rootDir>/src/$1"
  }
}
