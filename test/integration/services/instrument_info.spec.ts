import TestService from "@services/instrument_info.service"
import { ServiceBroker } from "moleculer"
import { InstrumentInfo } from "tardis-dev"

describe("Test 'users' service", () => {
  let broker = new ServiceBroker({ logger: false })
  let instrumentInfoService = broker.createService(TestService)

  // Create a mock of "send" action
  //const mockSend = jest.fn(() => Promise.resolve("Fake Mail Sent"))
  // Replace "send" action with a mock in "mail" schema
  //MailSchema.actions.send = mockSend
  // Start the "mail" service
  // const instrumentInfoService = broker.createService(InstrumentInfoSchema)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("Test 'instrument-info.refresh' action", () => {
    describe("when refreshing eth", () => {
      it("contains eth quotes", async () => {
        let result = (await broker.call("instrument_info.refresh")) as InstrumentInfo[]
        const instrumentInfo = result[0]

        expect(instrumentInfo.baseCurrency).toEqual("ETH")
        expect(instrumentInfo.quoteCurrency).toEqual("ETH")
      })
    })

    describe("when refreshing btc", () => {
      it("contains eth quotes", async () => {
        let result = (await broker.call("instrument_info.refresh", {})) as InstrumentInfo[]
        const instrumentInfo = result[0]

        expect(instrumentInfo.baseCurrency).toEqual("ETH")
        expect(instrumentInfo.quoteCurrency).toEqual("ETH")

        // console.log("result", result)

        // expect(result).toBe("Fake Mail Sent")
        // Check if mock was called
        //      expect(mockSend).toBeCalledTimes(1)
      })
    })
  })
})
