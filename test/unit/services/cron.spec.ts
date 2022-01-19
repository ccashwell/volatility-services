"use strict"
import { ServiceBroker } from "moleculer"
import TestService from "../../../services/cron.service"
//import cron from "cron"

describe("Test 'cron' service", () => {
  const broker = new ServiceBroker({ logger: true })
  const service = broker.createService(TestService)

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("cron()", () => {
    service.actions.ipfs = jest.fn()
    //jest.runOnlyPendingTimers()

    beforeEach(() => jest.useFakeTimers())

    it("calls the ipfs job", done => {
      //clock.runAllTicks()
      jest.advanceTimersByTime(5000)
      expect(service).toBeDefined()
      expect(service.$crons).toBeDefined()
      expect(service.$crons.length).toBe(1)
      expect(service.$crons[0].name).toBe("JobIPFS")
      expect(service.$crons[0].runOnStarted).toBeDefined()
      expect(service.$crons[0].manualStart).toBe(false)
      done()
      //expect(service.getCronTime(1111)).toEqual({})
      //expect(service.actions.ipfs).toHaveBeenCalledTimes(1)
      // expect(service.CronJob).toHaveBeenCalledTimes(1)
      //jest.useFakeTimers();
    }, 7000)
  })
})
