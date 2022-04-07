import { DataSource } from "typeorm"
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"
import OrmConfig from "../../ormconfig"

//const { ...dataSourceOptions } = ormConfig.default

const datasource = new DataSource(OrmConfig("default") as PostgresConnectionOptions)
export default datasource

datasource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
    return
  })
  .catch(err => {
    console.error("Error during Data Source initialization", err)
  })
