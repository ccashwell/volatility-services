import { ok, err, Result } from "neverthrow"
import { GenericObject } from "moleculer"
import { ParseError } from "@lib/errors/parse_error"

/**
 * Provide a way that forces the user to check for errors.
 *
 * @param jsonString
 * @returns Result<R, ParseError>
 *
 */
export const safeJsonParse = <R extends GenericObject>(jsonString: string): Result<R, ParseError> => {
  try {
    return ok(JSON.parse(jsonString) as R)
  } catch (e: unknown) {
    return err(ParseError.from(e as Error))
  }
}
