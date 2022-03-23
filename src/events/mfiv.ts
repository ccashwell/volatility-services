// import { MfivContext, MfivParams, MfivResult } from "node-volatility-mfiv"

export interface MfivEvent {
  version: "2022-03-22"

  eventType: "MFIV.14D.ETH.INDEX.CREATED"

  metadata: {
    "uma.priceId": string
    uri: string
  }

  // uri: "https://storageapi.fleek.co/indices/methodology=mfiv/interval=14d/baseCurrency=ETH/exchange=deribit/instrument=option/ts=2021-01-03T07:02:00.543Z/evidence.json"
  // feedId: "mf4.ETH.14d"
  // topic: "com.volatility.indices.estimate.mfiv.14d.eth.option"
  // metric: "com.volatility.events.index.mfiv.14d.estimate.deribit.eth.option"

  // transaction_id: string
  //   context: MfivContext
  //   params: MfivParams
  //   result: MfivResult
  // }
}
