"use strict"

import fleek from "../../../datasources/fleek"
import { VGError } from "../../../lib/errors"

describe("Test 'fleek' client", () => {
  describe("upload()", () => {
    it("throws an error ", async () => {
      const result = await fleek.upload("test.json", "fleek test spec")
      expect(result.isOk()).toBe(false)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toEqual(VGError.FleekUploadFailure)
      }
    })
  })
})
