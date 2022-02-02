//#region Global Imports
import { Context } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { IRate } from "@interfaces"
//#endregion Interface Imports

const prefix = "rate"

export const risklessRate = async (
  ctx: Context,
  params: IRate.RisklessRateParams
): Promise<IRate.RisklessRateResponse> => await ctx.call(`${prefix}.risklessRate`, params)
