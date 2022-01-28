export default {
  version: "2022-01-01",
  metadata: {
    "uma.priceId": "mf4.ETH.14d",
    uri: "/indices/methodology=mfiv/interval=14d/baseCurrency=ETH/exchange=deribit/instrument=option/ts=2021-01-03T07:02:00.543Z/evidence.json"
  },
  eventType: "mfiv.eth.14d.index.created",
  // topic: "com.volatility.indices.estimate.mfiv.14d.eth.option",
  // metric: "com.volatility.events.index.mfiv.14d.estimate.deribit.eth.option",
  context: {
    methodology: "mfiv",
    at: "2021-10-03T07:05:00Z",
    nearDate: "2022-01-28T08:00:00.000Z",
    nextDate: "2022-02-02T08:00:00.000Z",
    currency: "ETH",
    exchange: "deribit",
    windowInterval: "14d",
    instrument: "option",
    risklessRate: 0.0056,
    risklessRateAt: "2021-10-01T07:02:00.000Z",
    risklessRateSource: "aave"
  },
  params: {
    at: "2021-10-01T07:02:00.000Z",
    nearDate: "2021-10-08T08:00:00.000Z",
    nextDate: "2021-10-15T08:00:00.000Z",
    underlyingPrice: 3030.75,
    isBurnInPeriod: true,
    options: [
      {
        expirationDate: "2021-10-15T08:00:00.000Z",
        strikePrice: 2700,
        symbol: "ETH-15OCT21-2700-P",
        underlyingPrice: 3027.64,
        bestBidPrice: 0.0315,
        bestAskPrice: 0.0325,
        markPrice: 0.031999,
        mid: 96.98400000000001,
        optionType: "put",
        timestamp: "2021-10-01T07:01:45.597Z"
      },
      {
        expirationDate: "2021-10-15T08:00:00.000Z",
        strikePrice: 2700,
        symbol: "ETH-15OCT21-2700-P",
        underlyingPrice: 3030.75,
        bestBidPrice: 0.0315,
        bestAskPrice: 0.0325,
        markPrice: 0.031999,
        mid: 96.98400000000001,
        optionType: "put",
        timestamp: "2021-10-01T07:01:45.597Z"
      }
    ]
  },
  result: {
    dVol: 103.82139408011474,
    invdVol: 96.31926144512572,
    intermediates: {}
  }
}
