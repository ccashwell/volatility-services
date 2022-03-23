import { DataSource } from "typeorm"
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"
import * as ormConfig from "../../ormconfig"

const { ...dataSourceOptions } = ormConfig.default

export default new DataSource(dataSourceOptions as PostgresConnectionOptions)
