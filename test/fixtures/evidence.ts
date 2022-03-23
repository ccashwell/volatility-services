export default {
  version: "2022-01-1",
  type: "mfiv.14d.eth",
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
    risklessRateSource: "AAVE"
  },
  params: {
    at: "2021-10-01T07:02:00.000Z",
    nearDate: "2021-10-08T08:00:00.000Z",
    nextDate: "2021-10-15T08:00:00.000Z",
    underlyingPrice: 3030.75,
    isBurnInPeriod: true,
    options: []
  },
  result: {
    dVol: 103.82139408011474,
    invdVol: 96.31926144512572,
    intermediates: {},
    value: "103.82139408011474",
    estimatedFor: "2021-10-01T07:02:00.000Z"
  }
}
