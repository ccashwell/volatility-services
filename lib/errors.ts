import { Failure } from "./failure"

export enum VGError {
  FleekUploadFailure = "FleekUploadFailure"
}

export const fleekUploadFailure = (err: Error): Failure<VGError.FleekUploadFailure> => ({
  type: VGError.FleekUploadFailure,
  reason: "Error uploading data to fleek",
  wrappedError: err
})
