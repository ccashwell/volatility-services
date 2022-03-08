import { toIsoNoMs, toUnixTimestamp } from "@lib/utils/date"

describe("Test 'toUnixSec'", () => {
  const str = "2021-01-25T10:15:45.145Z"

  describe(`when the time is '${str}'`, () => {
    test("returns unix timestamp in seconds", () => {
      const subject = toUnixTimestamp(new Date(str))
      expect(subject).toEqual(1611569745)
    })
  })
})

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
        expect(str).toMatch(new RegExp(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/))
      })
    })
  })
})
