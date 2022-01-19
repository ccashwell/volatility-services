import { streamNormalized, normalizeOptionsSummary, replayNormalized, Exchange } from "tardis-dev"
import config from "../configuration"

/**
 * Realtime stream of OptionSummary data.
 *
 * @param symbols - options to receive OptionSummary updates for
 * @returns an AsyncIterableIterator<OptionSummary>
 */
export const stream = ({ exchange, symbols }: { exchange: "deribit"; symbols: string[] }) =>
  streamNormalized(
    {
      exchange,
      symbols
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
export const historical = (exchange: "deribit", symbols: string[], from: string, to: string) =>
  replayNormalized(
    {
      exchange,
      symbols,
      from,
      to,
      waitWhenDataNotYetAvailable: config.tardis.waitWhenDataNotYetAvailable
    },
    normalizeOptionsSummary
  )
