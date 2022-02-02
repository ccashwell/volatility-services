//#region Global Imports
import { createConnection, Connection } from "typeorm"
//#endregion Global Imports

import config from "../../configuration"

export default async (): Promise<Connection> =>
  await createConnection({
    type: "postgres",
    name: "default",
    database: config.db?.database,
    entities: [__dirname + "/*"],
    synchronize: true
  })
