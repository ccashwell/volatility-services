import { IInstrumentInfo } from "@interfaces"
import { Context, Errors, Service } from "moleculer"

const prefix = "instrument_info"

export async function instrumentInfos(
  ctx: Context | Service,
  params: IInstrumentInfo.InstrumentInfoParams
): Promise<IInstrumentInfo.InstrumentInfoResponse> {
  const suffix = params.asset.toLowerCase()

  if (ctx instanceof Context) {
    return await ctx.call(`${prefix}-${suffix}.instrumentInfo`, params)
  } else if (ctx instanceof Service) {
    return await ctx.broker.call(`${prefix}-${suffix}.instrumentInfo`, params)
  }

  throw new Errors.MoleculerClientError(`Expected Context or Broker but received ${ctx}`, 500, "VG_HELPER_ERROR")
}
