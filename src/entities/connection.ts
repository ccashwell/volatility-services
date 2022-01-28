//#region Global Imports
import { createConnection, Connection } from "typeorm"
//#endregion Global Imports

import config from "../../configuration"

export default async (): Promise<Connection | undefined> => {
  try {
    return await createConnection({
      type: "postgres",
      name: "default",
      database: config.db?.database,
      entities: [__dirname + "/*"],
      synchronize: true
    })
  } catch (error) {
    return undefined
  }
}
