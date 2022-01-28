import { Errors, LoggerInstance } from "moleculer"
import { Failure } from "../failure"
import { VGError, VGServerError } from "../errors"

export const handleError = (err: unknown) => {
  switch (err) {
    case Errors.MoleculerClientError:
      return err as Errors.MoleculerClientError
    case Errors.MoleculerError:
      return err as Errors.MoleculerError
    case err as Failure<VGError>:
      return err as Failure<VGError>
    case err as Error:
      return err as Error
    default:
      throw err
  }
}

type ErrorOf<T> = T extends VGServerError
  ? T
  : T extends typeof Errors.MoleculerError | Failure<VGError> | Error
  ? T
  : never
export const errorHandler =
  <E>(logger: LoggerInstance) =>
  (err: ErrorOf<E>) => {
    logger.error("Unhandled Error", err)
    return err
  }
