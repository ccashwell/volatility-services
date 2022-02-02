import { Errors, LoggerInstance } from "moleculer"
import { ErrorType } from "../types"
import { Failure } from "../failure"
import { VGError } from "../errors"

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

export function handleAsMoleculerError(err: unknown): Errors.MoleculerError {
  let errObj

  switch (err) {
    case Errors.MoleculerServerError:
      return err as Errors.MoleculerServerError
    case Errors.MoleculerRetryableError:
      return err as Errors.MoleculerRetryableError
    case Errors.MoleculerClientError:
      return err as Errors.MoleculerClientError
    case Errors.MoleculerError:
      return err as Errors.MoleculerError
    case err as Failure<VGError>:
      return errorFromFailure(err as Failure<VGError>)
    case err as Error:
      errObj = err as Error
      return new Errors.MoleculerError(errObj.message, 500, "UNCATEGORIZED_ERROR", {
        stack: errObj.stack,
        name: errObj.name
      })
    default:
      throw err
  }
}

export const errorHandler = (logger: LoggerInstance) => (err: ErrorType) => {
  logger.error("Unhandled Error", err)
  return err
}
