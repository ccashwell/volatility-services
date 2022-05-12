import { initTardis } from "@datasources/tardis"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { getInstrumentInfo, InstrumentInfo } from "tardis-dev"
import { chainFrom } from "transducist"

dayjs.extend(utc)
// dayjs.extend(duration)

describe("Test anytime mfiv expiration dates", () => {
  let sortedExpiries: InstrumentInfo[]
  let expiryMap: Map<string, (Required<InstrumentInfo> & { listing: string })[]>
  let available: (o: Required<InstrumentInfo> & { listing: string }) => boolean

  beforeAll(async () => {
    initTardis()

    const expiries = await getInstrumentInfo("deribit", {
      baseCurrency: "ETH",
      type: "option"
    })

    expiryMap = chainFrom(expiries as (Required<InstrumentInfo> & { listing: string })[])
      .filter(available)
      .toMapGroupBy(o => o.expiry)
    // .sort((a, b) => {
    //   return (a.expiry as string) < (b.expiry as string) ? -1 : a.expiry == b.expiry ? 0 : 1
    // })
  })

  describe("when timePeriod = 14D", () => {
    const timePeriod = 14

    describe("with now = 2022-04-01T00:00:00.000Z", () => {
      const now = "2022-04-01T00:00:00.000Z"

      available = (o: Required<InstrumentInfo> & { listing: string }) => {
        return o.listing <= now && now <= o.expiry
      }

      const $tp = dayjs.utc(now).add(timePeriod, "days")
      //      console.log("$tp", $tp.toISOString())

      it("returns near and next expiries", () => {
        const activeExpiries = Array.from(expiryMap.keys()).sort()

        // console.log("keys", activeExpiries)

        let nearExpiry: string | undefined, nextExpiry: string | undefined
        let nearDiff = Infinity
        let nextDiff = Infinity

        activeExpiries.forEach(expiry => {
          const delta = dayjs.utc(expiry).diff($tp)

          if (delta < 0 && delta < nearDiff) {
            nearDiff = delta
            nearExpiry = expiry
          } else if (delta > 0 && delta < nextDiff) {
            nextDiff = delta
            nextExpiry = expiry
          }
        })

        expect(nearExpiry).toEqual("2022-04-01T08:00:00.000Z")
        expect(nextExpiry).toEqual("2022-04-15T08:00:00.000Z")
      })
    })
  })

  describe("when timePeriod = 1D", () => {
    const timePeriod = 1

    describe("with now = 2022-04-01T00:00:00.000Z", () => {
      const now = "2022-04-01T00:00:00.000Z"

      available = (o: Required<InstrumentInfo> & { listing: string }) => {
        return o.listing <= now && now <= o.expiry
      }

      const $tp = dayjs.utc(now).add(timePeriod, "days")
      //      console.log("$tp", $tp.toISOString())

      it("returns near and next expiries", () => {
        const activeExpiries = Array.from(expiryMap.keys()).sort()

        // console.log("keys", activeExpiries)

        let nearExpiry: string | undefined, nextExpiry: string | undefined
        let nearDiff = Infinity
        let nextDiff = Infinity

        activeExpiries.forEach(expiry => {
          const delta = dayjs.utc(expiry).diff($tp)

          if (delta < 0 && delta < nearDiff) {
            nearDiff = delta
            nearExpiry = expiry
          } else if (delta > 0 && delta < nextDiff) {
            nextDiff = delta
            nextExpiry = expiry
          }
        })

        expect(nearExpiry).toEqual("2022-04-01T08:00:00.000Z")
        expect(nextExpiry).toEqual("2022-04-02T08:00:00.000Z")

        console.log(
          "near expiries",
          (expiryMap.get(nearExpiry as string) || []).map(o => o.id)
        )
        console.log(
          "next expiries",
          (expiryMap.get(nearExpiry as string) || []).map(o => o.id)
        )
      })
    })
  })
})
