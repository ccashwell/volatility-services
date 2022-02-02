"use strict"
import { ServiceBroker } from "moleculer"
import TestService from "../../../services/ingest.service"

describe("Test 'ingest' service", () => {
  const broker = new ServiceBroker({ logger: true })
  broker.createService(TestService)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("ingest()", () => {
    it("processes messages", async () => {
      console.log("ingest processing()")
      //broker.emit("ingest.start")
      // await broker.call("ingest.process")
      //jest.useFakeTimers();
    }, 30000)
  })
})
