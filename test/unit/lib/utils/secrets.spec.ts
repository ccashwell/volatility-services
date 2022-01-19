"use strict"

import secrets from "../../../../lib/utils/secrets"

describe("Test 'secrets' client", () => {
  it("reads the secrets blob", async () => {
    const hash = await secrets()
    console.log("debug", hash)
  }, 30000)
})
