//#region Global Imports
import { Context } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { IIngest } from "@interfaces"
//#endregion Interface Imports

const prefix = "ingest"

export const optionSummaries = async (
  ctx: Context,
  params: IIngest.OptionSummariesParams
): Promise<IIngest.OptionSummariesResponse> => await ctx.call(`${prefix}.optionSummaries`, params)
