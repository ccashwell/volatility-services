"use strict"

import { toIsoNoMs } from "../../../../lib/utils/date"

describe("Test 'toIsoNoMs'", () => {
  const str = "2021-01-25T10:15:45.145Z"

  describe(`when the time is '${str}'`, () => {
    test("returns iso8601 string w/o milliseconds (2021-01-25T10:15:45Z)", () => {
      const subject = toIsoNoMs(new Date(str))
      expect(subject).toEqual("2021-01-25T10:15:45Z")
    })
  })

  describe(`when parsing a toIsoNoMs generated string`, () => {
    const str = "2021-01-25T10:15:45Z"

    describe(`when the string is '${str}'`, () => {
      test("new Date(str) is successful", () => {
        const subject = new Date(str)
        expect(str).toBeISODate()
      })
    })
  })
})
