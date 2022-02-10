import { mock, MockProxy } from "jest-mock-extended"
import { DefaultClient } from "@clients/secrets_client"
import { SecretClient } from "@clients/types"

describe("SecretsClient", () => {
  let mockProxyClient: MockProxy<typeof DefaultClient>
  let mockProxy: MockProxy<SecretClient>

  describe("DefaultClient", () => {
    beforeEach(() => {
      mockProxyClient = mock<typeof DefaultClient>()
    })

    it("can read TARDIS_API_KEY", () => {
      const foo = mock<SecretClient>()
      foo.requireRead("TARDIS_API_KEY")
      expect(foo.requireRead).toHaveBeenCalledWith("TARDIS_API_KEY")
      // const mockClient = mockProxyClient({ secretName: "MySecret" })
      // mockClient.requireRead("TARDIS_API_KEY")

      // expect(mockClient).toHaveBeenCalledWith("TARDIS_API")
    })
  })
})
