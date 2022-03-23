import { Context, Service, ServiceBroker } from "moleculer"
import * as Cron from "moleculer-cron"

/**
 * Compute index values from data produced by the ingest service
 */
export default class TestService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      name: "test",

      mixins: [Cron],

      crons: [
        {
          name: "EmitIndex",
          cronTime: "*/1 * * * *",
          onTick: async () => {
            this.logger.info("Calling emit index onTick()")
            await this.actions.mfiv14dEth()
          },
          timeZone: "UTC"
        }
      ],

      actions: {
        mfiv14dEth: {
          // visibility: "protected",
          ws: {
            publish: true,
            send: false,
            conditional: false // Should return a truthy result
          },
          handler(ctx: Context) {
            this.logger.info("Cron Fired mfiv14dEth", ctx)

            const payload = {
              topic: "MFIV.14D.ETH",
              message: {
                id: "MFIV.14D.ETH",
                type: "index:mfiv",
                dVol: 42.0,
                invdVol: 77.0,
                methodology: "MFIV",
                timePeriod: "14D",
                asset: "ETH",
                underlying: 2222.42,
                timestamp: new Date()
              }
            }

            return payload
            // const encoder = new TextEncoder()
            // return encoder.encode(JSON.stringify(payload))
          }
        }
      },
      methods: {}
    })
  }
}
