import CronService from "@services/cron.service"
import { ServiceBroker } from "moleculer"

describe("Test 'cron' service", () => {
  let broker: ServiceBroker
  let service: CronService
  try {
    broker = new ServiceBroker({ logger: true })
    service = broker.createService(CronService)
    service.ipfs = jest.fn()
  } catch (err) {
    console.error(err)
  }

  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("cron()", () => {
    // service.actions.ipfs = jest.fn()
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
    }, 7000)
  })
})
