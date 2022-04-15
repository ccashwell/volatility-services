import { IIndex } from "@interfaces"
import { Context } from "moleculer"
import { OptionSummary } from "tardis-dev"
import { chainFrom } from "transducist"

const prefix = "ingest"

interface MethodologyDates {
  nearExpiration: string
  nextExpiration: string
  rollover: string
}

export const optionSummariesLists = async (
  ctx: Context<IIndex.EstimateParams>,
  params: MethodologyDates
): Promise<OptionSummary[]> => {
  const { asset } = ctx.params
  const suffix = asset.toLowerCase()

  const expiries: { status: string; value: OptionSummary[] }[] = await ctx.mcall(
    [
      { action: `${prefix}-${suffix}.summaries`, params: { expiry: params.nearExpiration, asset } },
      { action: `${prefix}-${suffix}.summaries`, params: { expiry: params.nextExpiration, asset } }
    ],
    { settled: true }
  )

  // TODO: mapErr if one of the promises was rejected
  return chainFrom(expiries)
    .filter((e: { status: string; value: OptionSummary[] }) => e.status === "fulfilled")
    .flatMap(e => e.value)
    .map(o => {
      return { ...o, timestamp: o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp) }
    })
    .toArray()
}
