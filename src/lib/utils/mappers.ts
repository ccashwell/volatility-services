import { IRate } from "@interfaces"

export const Mappers = {
  Rate: {
    from: (item: IRate.RisklessRateResponse & { contractValue: number }) => ({
      value: item.risklessRate.toString(),
      sourceValue: item.contractValue,
      source: item.risklessRateSource,
      rateAt: new Date()
    })
  }
}
