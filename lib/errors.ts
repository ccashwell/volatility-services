import { Failure } from "./failure"

export enum VGError {
  FleekUploadFailure = "FleekUploadFailure",
  InstrumentInfoFailure = "InstrumentInfoFailure",
  CreateStreamFailure = "CreateStreamFailure"
}

export const fleekUploadFailure = (err: Error): Failure<VGError.FleekUploadFailure> => ({
  type: VGError.FleekUploadFailure,
  reason: "Error uploading data to fleek",
  wrappedError: err
})

export const instrumentInfoFailure = (err: Error): Failure<VGError.InstrumentInfoFailure> => ({
  type: VGError.InstrumentInfoFailure,
  reason: "Error getting InstrumentInfo[]",
  wrappedError: err
})

export const createStreamFailure = (err: Error): Failure<VGError.CreateStreamFailure> => ({
  type: VGError.CreateStreamFailure,
  reason: "Error creating tardis option stream",
  wrappedError: err
})
