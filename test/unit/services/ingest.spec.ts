"use strict"
import { ServiceBroker } from "moleculer"
import { InstrumentInfo } from "tardis-dev"
import TestService from "../../../services/ingest.service"
import DependentService from "../../../services/instrument.service"

describe("Test 'ingest' service", () => {
  const broker = new ServiceBroker({ logger: true })
  broker.createService(DependentService)
  broker.createService(TestService)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("ingest()", () => {
    it("processes messages", async () => {
      console.log("ingest processing()")
      await broker.call("ingest.process")
      //jest.useFakeTimers();
    }, 30000)
  })
})
