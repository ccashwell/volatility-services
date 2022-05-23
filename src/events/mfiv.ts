// import { MfivContext, MfivParams, MfivResult } from "node-volatility-mfiv"

export interface MfivEvent {
  version: "2022-03-22"

  eventType: "MFIV.14D.ETH.INDEX.CREATED" | "MFIV.14D.BTC.INDEX.CREATED" | "MFIV.14D.SOL.INDEX.CREATED"

  metadata: {
    "uma.priceId": string
    uri: string
  }
}
