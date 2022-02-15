import { MfivContext, MfivParams, MfivResult } from "./types"
/**
 * Compute the volatility index value for the given mfiv context and model parameters
 *
 * @param ctx Methodology context object
 * @param params Inputs for calculating the index
 * @returns a result object containing the index value and its intermediates
 */
export declare function compute(context: MfivContext, params: MfivParams): MfivResult
