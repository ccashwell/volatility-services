//#region Global Imports
import { Context } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { OptionSummary } from "tardis-dev"
//#endregion Interface Imports

const prefix = "ingest"

interface MethodologyDates {
  nearExpiration: string
  nextExpiration: string
  rollover: string
}

export const optionSummariesLists = async (ctx: Context, params: MethodologyDates) => {
  const expiries: { status: string; value: OptionSummary[] }[] = await ctx.mcall(
    [
      { action: `${prefix}.summaries`, params: { expiry: params.nearExpiration } },
      { action: `${prefix}.summaries`, params: { expiry: params.nextExpiration } }
    ],
    { settled: true }
  )

  // TODO: mapErr if one of the promises was rejected
  return expiries
    .filter((e: { status: string; value: OptionSummary[] }) => e.status === "fulfilled")
    .map(e => e.value)
    .flat()
}
