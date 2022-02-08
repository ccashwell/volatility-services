//#region Global Imports
// import { TypeOrmDbAdapter } from "moleculer-db-adapter-typeorm"
//#endregion Global Imports

import { Connection, createConnection } from "typeorm"
import configuration from "@configuration"

export default async (): Promise<Connection | undefined> => {
  try {
    return await createConnection()
  } catch (error) {
    console.error(error)
    return undefined
  }
}
// export default (name: string) => {
//   // eslint-disable-next-line no-debugger
//   debugger
//   const adapter = configuration.adapter
//   return new TypeOrmDbAdapter({ ...adapter, name })
// }
// export default _.once(() => getConnection())

// export default _.once(() => {
//   console.info("Creating DB Connection")
//   const adapter = new TypeOrmDbAdapter(configuration.adapter)
//   return adapter
// })

//   async () =>
//     await createConnection({
//       type: "postgres",
//       name: "default",
//       database: configuration.db?.database,
//       entities: [__dirname + "/*"],
//       synchronize: true
//     })
// )
