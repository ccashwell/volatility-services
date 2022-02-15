import { EXCHANGES, METHODOLOGIES, VERSIONS, CURRENCIES, MFIV_DURATIONS, EVIDENCES } from "./constants"
import { OptionPair } from "./models/optionpair"
export declare type Version = typeof VERSIONS[number]
export declare type Currency = typeof CURRENCIES[number]
export declare type Exchange = typeof EXCHANGES[number]
export declare type Methodology = typeof METHODOLOGIES[number]
export declare type Evidence = typeof EVIDENCES[number]
export declare type MfivDuration = typeof MFIV_DURATIONS[number]
/**
 * Data type to represent the number of milliseconds since January 1, 1970
 */
export declare type UnixEpochType = number
/**
 * A Date value serialized as an iso8601 timestamp
 */
export declare type IsoDateString = string
/**
 * Emitted data points expressed as metrics
 */
export interface Metric {
  readonly type: string
  readonly value: string
  readonly timestamp: UnixEpochType
}
export declare type Metadata = unknown
export declare type MethodologyEvidence<
  V extends Version,
  E extends Evidence,
  M extends Metadata,
  C extends Context,
  P extends Params,
  R extends Result
> = {
  version: V
  type: E
  metadata?: M
  context: C
  params: P
  result: R
}
export interface OptionPrice {
  readonly optionPrice: number
}
export declare type OptionSummaryInput = {
  readonly symbol: string
  readonly timestamp: Date
  readonly optionType: "put" | "call"
  readonly expirationDate: Date
  readonly strikePrice: number
  readonly bestBidPrice: number | undefined
  readonly bestAskPrice: number | undefined
  readonly markPrice: number | undefined
  readonly underlyingPrice: number | undefined
}
export declare type OptionSummary = {
  readonly symbol: string
  readonly timestamp: Date
  readonly optionType: "put" | "call"
  readonly expirationDate: Date
  readonly strikePrice: number
  readonly bestBidPrice: number
  readonly bestAskPrice: number
  readonly markPrice: number
  readonly underlyingPrice: number
}
export declare type BaseContext = {
  readonly methodology: Methodology
  readonly exchange: Exchange
  readonly currency: Currency
}
export declare type OptionType = {
  optionType: "call" | "put"
}
export declare type MfivContext = BaseContext & {
  readonly windowInterval: MfivDuration
  readonly risklessRate: number
  readonly risklessRateAt: string
  readonly risklessRateSource: string
}
export declare interface MfivParams {
  /** t0 value */
  at: string
  /** options expiring at 8:00AM UTC on the friday after t0 */
  nearDate: string
  /** options expiring at 8:00AM UTC on the friday preceeding t14 */
  nextDate: string
  /** Options having an expiration matching nearDate OR nextDate  */
  options: OptionSummary[]
  /** Use a fixed underlying price */
  underlyingPrice: number
}
export declare type Context = MfivContext
export declare type Params = MfivParams
export declare type Result = MfivResult
export declare type OptionPairMap<T extends OptionPrice & OptionSummary> = Map<string, OptionPair<T>>
export interface Expiries<T extends OptionSummary & OptionPrice> {
  nearOptionPairMap: OptionPairMap<T>
  nextOptionPairMap: OptionPairMap<T>
  nearBook: T[]
  nextBook: T[]
}
export declare type MfivOptionSummary = OptionSummary &
  OptionPrice & {
    midPrice?: number
    markPrice: number
    source: "mid" | "mark"
    reason: "mid >= 1.5 * mark" | "bestAskPrice missing" | "mid < 1.5 * mark"
  }
export interface MfivEstimate {
  /** The value calculated - otherwise, undefined */
  readonly value: number | undefined
  /** Any intermediate terms generated in the calculation of mfiv */
  readonly intermediates?: MfivIntermediates
}
export interface MfivResultWithInverse {
  readonly dVol: number | undefined
  readonly invdVol: number | undefined
}
export interface MfivStep2Terms {
  finalNearBook: [string, MfivOptionSummary][]
  finalNextBook: [string, MfivOptionSummary][]
  NT1: number
  NT2: number
  N14: number
  N365: number
  T1: number
  T2: number
  F1: number
  F2: number
  nearForwardStrike: number
  nextForwardStrike: number
  nearContribution: number
  nextContribution: number
  nearModSigmaSquared: number
  nextModSigmaSquared: number
}
export declare type MfivIntermediates = MfivStep2Terms & {
  A: number
  B: number
  C: number
}
export declare type MfivResult = MfivEstimate &
  MfivResultWithInverse & {
    readonly methodology: "mfiv"
    readonly currency: Currency
    /** The time used (also expressed as 'ct' in the whitepaper) for the estimation */
    readonly estimatedFor: IsoDateString
    readonly metrics?: Metric[]
  }
export declare type MfivEvidence = MethodologyEvidence<
  "2022-01-01",
  "mfiv.estimate.evidence",
  unknown,
  MfivContext,
  MfivParams,
  MfivResult
>
//# sourceMappingURL=types.d.ts.map
