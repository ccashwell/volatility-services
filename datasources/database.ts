import { Sequelize } from "sequelize"
import SqlAdapter from "moleculer-db-adapter-sequelize"
import config from "../configuration"

// const { database, username, password } = config.db
// const
// export const database = config.mfiv.dbConnection
//export const dbAdapter = new SqlAdapter(config.db)
export const dbSequalizeAdapter = new Sequelize(config.db)
const sequelizeConnection = new Sequelize(config.db)

export default sequelizeConnection
