//#region Global Imports
import { createConnection, Connection } from "typeorm"
//#region Global Imports

// export default async (): Promise<Connection> => {
//   try {
//     return await createConnection({
//       name: "default",
//       type: "postgres",
//       username: "postgres",
//       password: "postgres",
//       database: "volatility_test",
//       entities: [
//         "./src/entities/fleek_transaction.ts",
//         "./src/entities/methodology_index.ts",
//         "./src/entities/rate.ts"
//       ],
//       synchronize: true,
//       dropSchema: true
//     })
//   } catch (error) {
//     console.error(error)
//     throw error
//   }
// }
