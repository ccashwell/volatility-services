import { IIndex } from "@interfaces"
import { Context, Service } from "moleculer"

const prefix = "index"

export async function estimate(
  ctx: Service | Context,
  params: IIndex.EstimateParams
): Promise<IIndex.EstimateResponse> {
  if (ctx instanceof Context) {
    return await ctx.call(`${prefix}.estimate`, params)
  } else {
    const { at, ...rest } = params
    return await ctx.broker.call<never, IIndex.EstimateParams>(`${prefix}.estimate`, {
      at: at instanceof Date ? at.toISOString() : at,
      ...rest
    })
  }
}
