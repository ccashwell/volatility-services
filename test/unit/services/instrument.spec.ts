"use strict"
import { ServiceBroker } from "moleculer"
import { InstrumentInfo } from "tardis-dev"
import TestService from "../../../services/instrument.service"

describe("Test 'instrument' service", () => {
  const broker = new ServiceBroker({ logger: false })
  broker.createService(TestService)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("instrumentInfo()", () => {
    it("should return with 'InstrumentInfo[]'", async () => {
      //jest.useFakeTimers();
      const res = (await broker.call("v1.instruments.instrumentInfo", {
        expirationDates: ["2022-01-21T08:00:00.000Z"]
      })) as { id: string; expiry: string }[]
      expect(res).toHaveLength(31792)
      console.log(res[0])
    }, 30000)
  })
})
