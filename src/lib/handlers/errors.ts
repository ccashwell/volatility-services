import { Errors, LoggerInstance } from "moleculer"
import { QueryFailedError, TypeORMError } from "typeorm"
import { DataSourceError, FatalDataSourceError, VGError, VGIgnorableError } from "../errors"
import { Failure } from "../failure"
import { ErrorType } from "../types"

export const handleTypeOrmError = (err: unknown): DataSourceError => {
  switch (err) {
    case QueryFailedError:
      const maybeConstraintError = err as QueryFailedError
      if (maybeConstraintError.message === "duplicate key value violates unique constraint") {
        return new VGIgnorableError(maybeConstraintError)
      }
      return new FatalDataSourceError(err as TypeORMError)
    case TypeORMError:
      return new FatalDataSourceError(err as TypeORMError)
    default:
      throw err
  }
}

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

const errorData = ({ details, issues, urls, envVars, configVars }: Failure<VGError>) => ({
  details,
  issues,
  urls,
  envVars,
  configVars
})

const errorFromFailure = (error: Failure<VGError>) => {
  const { retryable, reason, type } = error
  const errorKlass = retryable ? Errors.MoleculerRetryableError : Errors.MoleculerError

  return new errorKlass(reason, 500, type, errorData(error))
}

export function handleAsMoleculerError(err: unknown) {
  console.error(err)

  if (err instanceof Errors.MoleculerServerError) {
    return err
  } else if (err instanceof Errors.MoleculerRetryableError) {
    return err
  } else if (err instanceof Errors.MoleculerClientError) {
    return err
  } else if (err instanceof Errors.MoleculerError) {
    return err
  } else if (err instanceof Error) {
    return new Errors.MoleculerError(err.message, 500, "UNCATEGORIZED_ERROR", {
      stack: err.stack,
      name: err.name
    })
  } else {
    throw err
  }
}

export const errorHandler = (logger: LoggerInstance) => (err: ErrorType) => {
  logger.error("Unhandled Error", err)
  return err
}
