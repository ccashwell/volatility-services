import { IRate } from "@interfaces"
import { Context } from "moleculer"

const prefix = "rate"

export const risklessRate = async (
  ctx: Context,
  params: IRate.RisklessRateParams
): Promise<IRate.RisklessRateResponse> => await ctx.call(`${prefix}.risklessRate`, params)
