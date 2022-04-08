import { DataSource } from "typeorm"
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"
import OrmConfig from "../../ormconfig"

export const AppDataSourceFactory = (name: string) => new DataSource(OrmConfig(name) as PostgresConnectionOptions)
