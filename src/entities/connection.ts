import { Connection, createConnection, getConnection } from "typeorm"

export default async (): Promise<Connection | undefined> => {
  try {
    return getConnection()
    // return await createConnection()
  } catch (error) {
    console.error(error)
    return undefined
  }
}
