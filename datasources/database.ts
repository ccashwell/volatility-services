import { Sequelize } from "sequelize"
import SqlAdapter from "moleculer-db-adapter-sequelize"
import config from "../configuration"

export const database = config.mfiv.dbConnection
export const dbAdapter = new SqlAdapter(database)
export const dbSequalizeAdapter = new Sequelize(database)
