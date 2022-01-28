/* eslint-disable @typescript-eslint/ban-types */
//#region Global Imports
import { getManager, ObjectType } from "typeorm"
//#endregion Global Imports

//#region Local Imports
import { Throw404 } from "./error_helpers"
//#endregion Local Imports

export const getResource = async <E extends {}>(entityClass: ObjectType<E>, options: {}): Promise<E> => {
  const resource = await getManager().findOne(entityClass, options)

  Throw404(resource, `Resource can't be found with options: ${JSON.stringify(options)}`)

  return resource as E
}
