//#region Global Imports
import { createConnection, Connection } from "typeorm"
//#endregion Global Imports

import configuration from "@configuration"

export default async (): Promise<Connection> =>
  await createConnection({
    type: "postgres",
    name: "default",
    database: configuration.db?.database,
    entities: [__dirname + "/*"],
    synchronize: true
  })
