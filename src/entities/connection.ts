import { Connection, createConnection } from "typeorm"

export default async (): Promise<Connection | undefined> => {
  try {
    return await createConnection()
  } catch (error) {
    console.error(error)
    return undefined
  }
}
