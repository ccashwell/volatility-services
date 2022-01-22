"use strict"
import MethodologyIndexInput from "../../../database/models/methodology_index"

describe("Test 'MethodologyIndex' model", () => {
  describe("save()", () => {
    const model = MethodologyIndexInput.build({
      baseCurrency: "ETH",
      exchange: "deribit",
      value: "0.123456789",
      methodology: "mfiv",
      symbolType: "option",
      timestamp: new Date(),
      interval: "14d",
      extra: {}
    })

    it("returns the saved model", async done => {
      const result = await model.save()
      expect(result).toEqual(model)
      done()
    })
  })
})
