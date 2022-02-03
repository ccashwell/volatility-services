//#region Global Imports
import { Context, ServiceBroker } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { IIndex } from "@interfaces"
// import CronService from "@services/cron.service"
//#endregion Interface Imports

const prefix = "index"

// export const estimate = async (service: CronService, params: IIndex.EstimateParams): Promise<IIndex.EstimateResponse> =>
//   await service.broker.call<never, IIndex.EstimateParams>(`${prefix}.estimate`, params)

export const estimate = async (ctx: Context, params: IIndex.EstimateParams): Promise<IIndex.EstimateResponse> =>
  await ctx.call(`${prefix}.estimate`, params)
