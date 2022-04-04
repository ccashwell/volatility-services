import { IIPFS } from "@interfaces"
import { IIPFSServiceMeta } from "@interfaces/meta"
import { Context } from "moleculer"

const prefix = "ipfs"

export const store = async (
  ctx: Context<IIPFS.StoreParams, IIPFSServiceMeta>,
  params: IIPFS.StoreParams
): Promise<IIPFS.StoreResponse> => await ctx.call(`${prefix}.store`, params)
