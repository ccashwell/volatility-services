//#region Global Imports
import { Context } from "moleculer"
//#endregion Global Imports

//#region Interface Imports
import { IIPFS } from "@interfaces"
import { IIPFSServiceMeta } from "@interfaces/meta"
//#endregion Interface Imports

const prefix = "ipfs"

export const store = async (
  ctx: Context<IIPFS.StoreParams, IIPFSServiceMeta>,
  params: IIPFS.StoreParams
): Promise<IIPFS.StoreResponse> => await ctx.call(`${prefix}.store`, params)
