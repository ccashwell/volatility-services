"use strict"

import { mfivDates } from "@lib/expiries"

describe("Test mfivDates()", () => {
  describe("timePeriod = 14D", () => {
    const timePeriod = "14D"

    describe("when the date is 2021-01-01T07:00:00.000Z", () => {
      const now = "2021-01-01T07:00:00.000Z"

      it("returns near, next, and rollover", done => {
        const subject = mfivDates(new Date(now), timePeriod)

        expect(subject).toMatchObject({
          nearExpiration: "2021-01-08T08:00:00.000Z",
          nextExpiration: "2021-01-15T08:00:00.000Z",
          rollover: "2021-01-01T08:00:00.000Z"
        })

        done()
      })
    })

    describe("when the date is 2021-01-01T09:00:00.000Z", () => {
      const now = "2021-01-01T09:00:00.000Z"

      it("returns near, next, and rollover", done => {
        const subject = mfivDates(new Date(now), timePeriod)

        expect(subject).toMatchObject({
          nearExpiration: "2021-01-15T08:00:00.000Z",
          nextExpiration: "2021-01-22T08:00:00.000Z",
          rollover: "2021-01-08T08:00:00.000Z"
        })

        done()
      })
    })
  })
})
