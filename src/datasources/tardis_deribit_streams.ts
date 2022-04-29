import { computeOptionBucket } from "@computables/option_bucket"
import { NormalizedExchange } from "@lib/types"
import {
  compute,
  Exchange,
  normalizeOptionsSummary,
  replayNormalized,
  ReplayNormalizedOptions,
  streamNormalized,
  StreamNormalizedOptions
} from "tardis-dev"
import configuration from "../configuration"

/**
 * Realtime stream of OptionSummary data.
 *
 * @param symbols - options to receive OptionSummary updates for
 * @returns an AsyncIterableIterator<OptionSummary>
 */
export const stream = <T extends Exchange & NormalizedExchange>({
  exchange,
  symbols,
  onError
}: StreamNormalizedOptions<T, true>) =>
  streamNormalized(
    {
      exchange,
      symbols,
      onError
    },
    normalizeOptionsSummary
  )
/**
 * Historical replay stream of OptionSummary data. This mimics what happened as Tardis.dev
 * recorded the data.
 *
 * @remarks It is assumed that the from/to params have been adjusted by the caller
 *
 * @param symbols - options to receive OptionSummary updates for
 * @param from - an iso8601 date string "YYYY-MM-DDTHH:MM:SS.mmmZ"
 * @param to - an iso8601 date string "YYYY-MM-DDTHH:MM:SS.mmmZ"
 * @returns an AsyncIterableIterator<OptionSummary>
 */
export const historical = <
  T extends Exchange & NormalizedExchange,
  // U extends MapperFactory<T, any>[],
  Z extends boolean = false
>({
  exchange,
  symbols,
  from,
  to,
  waitWhenDataNotYetAvailable = configuration.tardis.waitWhenDataNotYetAvailable
}: ReplayNormalizedOptions<T, Z>) =>
  compute(
    replayNormalized(
      {
        exchange,
        symbols,
        from,
        to,
        withDisconnectMessages: false,
        waitWhenDataNotYetAvailable
      },
      normalizeOptionsSummary
    ),
    computeOptionBucket({ kind: "time", interval: 1000 })
  )
