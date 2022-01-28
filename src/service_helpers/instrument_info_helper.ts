//#region Global Imports
import { Context } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { IInstrumentInfo } from "@interfaces"
//#endregion Interface Imports

const prefix = "instrument_info"

export const instrumentInfo = async (
  ctx: Context,
  params: IInstrumentInfo.InstrumentInfoParams
): Promise<IInstrumentInfo.InstrumentInfoResponse> => await ctx.call(`${prefix}.instrumentInfo`, params)
