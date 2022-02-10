import { Errors } from "moleculer"
import { Failure } from "../failure"

export enum VGError {
  FleekUploadFailure = "FleekUploadFailure",
  InstrumentInfoFailure = "InstrumentInfoFailure",
  CreateStreamFailure = "CreateStreamFailure",
  ConfigurationFailure = "ConfigurationFailure",
  FetchInstrumentsFailure = "FetchInstrumentsFailure",
  InsufficientDataFailure = "InsufficientDataFailure",
  RateServiceFailure = "RateServiceFailure"
}

export const fleekUploadFailure = (err: Error): Failure<VGError.FleekUploadFailure> => ({
  type: VGError.FleekUploadFailure,
  reason: "Error uploading data to fleek",
  details: ["Recoverable errors are not being handled. Check wrappedError for details"],
  wrappedError: err,
  configVars: ["FLEEK_ID", "FLEEK_SECRET"],
  issues: ["Issue: http://github.com/volatilitygroup/automated-failures/issues#tag?FleekUploadFailure"]
})

export const instrumentInfoFailure = (err: Error): Failure<VGError.InstrumentInfoFailure> => ({
  type: VGError.InstrumentInfoFailure,
  reason: "Error getting InstrumentInfo[]",
  details: ["Check if the error is recoverable"],
  envVars: ["TARDIS_API", "TARDIS_SECRET"],
  issues: [`Issue: ${err.message}`],
  wrappedError: err
})

export const createStreamFailure = (err: Error): Failure<VGError.CreateStreamFailure> => ({
  type: VGError.CreateStreamFailure,
  reason: "Error creating tardis option stream",
  details: [
    err ? `Issue: ${err.message}` : `Issue: process.env.TARDIS_KEY ${process.env.TARDIS_KEY ? "set" : "not set"}`
  ],
  wrappedError: err
})

export const configurationError = (
  varName: string,
  wrappedError: Error | Failure<VGError> | undefined
): Failure<VGError.ConfigurationFailure> => ({
  type: VGError.ConfigurationFailure,
  reason: `Configuration error encountered ${varName ? "(env:" + varName + ")" : +""}`,
  envVars: [varName],
  wrappedError
})

export const fetchInstrumentsError = (
  wrappedError: Error | Failure<VGError> | undefined
): Failure<VGError.FetchInstrumentsFailure> => ({
  type: VGError.FetchInstrumentsFailure,
  reason: "Unhandled fetchInstruments Error",
  envVars: ["TARDIS_API_KEY"],
  configVars: ["tardis.exchange", "mfiv.baseCurrency"],
  wrappedError
})

export class VGServerError extends Errors.MoleculerError {
  constructor(msg: string, options: Failure<VGError> | undefined = undefined) {
    super(msg || "Unhandled server error", 500, options?.type ?? "ERROR_ISE", options)
  }
}

export const insufficientDataError = (reason: string, details: string[]): Failure<VGError.InsufficientDataFailure> => ({
  type: VGError.InsufficientDataFailure,
  details,
  reason
})

export const risklessRateError = (
  error: Errors.MoleculerServerError | Errors.MoleculerClientError
): Failure<VGError.RateServiceFailure> => ({
  type: VGError.RateServiceFailure,
  reason: error.message ?? "Rate Service Error",
  wrappedError: error,
  retryable: error.retryable
})
