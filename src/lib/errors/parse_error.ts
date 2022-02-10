import { Errors } from "moleculer"

export class ParseError extends Errors.MoleculerClientError {
  constructor(err: Error) {
    super("Parse error", 500, "VG_SERIALIZATION_ERROR", { wrappedError: err })
  }

  static from(err: Error): ParseError {
    return new ParseError(err)
  }
}
