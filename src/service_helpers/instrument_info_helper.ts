import { IInstrumentInfo } from "@interfaces"
import { Context } from "moleculer"

const prefix = "instrument_info"

export const instrumentInfo = async (
  ctx: Context,
  params: IInstrumentInfo.InstrumentInfoParams
): Promise<IInstrumentInfo.InstrumentInfoResponse> => await ctx.call(`${prefix}.instrumentInfo`, params)
