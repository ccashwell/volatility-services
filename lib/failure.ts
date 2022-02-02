import { VGError } from "./errors"

export interface Failure<FailureType extends string> {
  type: FailureType
  reason: string
  details?: string[]
  wrappedError?: Failure<VGError> | Error
  envVars?: string[]
  configVars?: string[]
  issues?: string[]
  urls?: string[]
  retryable?: boolean
}
