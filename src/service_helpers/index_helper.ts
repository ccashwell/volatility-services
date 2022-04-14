import { IIndex } from "@interfaces"
import { Context, Service } from "moleculer"

const prefix = "index"

export async function estimate(
  ctx: Service | Context,
  params: IIndex.EstimateParams
): Promise<IIndex.EstimateResponse> {
  const suffix = params.asset.toLowerCase()

  if (ctx instanceof Context) {
    return await ctx.call(`${prefix}-${suffix}.estimate`, params)
  } else {
    const { at, ...rest } = params
    return await ctx.broker.call<never, IIndex.EstimateParams>(`${prefix}-${suffix}.estimate`, {
      at: at instanceof Date ? at.toISOString() : at,
      ...rest
    })
  }
}
