import { MethodologyIndex } from "@entities"
import { MfivEvent } from "@events"
import { Context, Service, ServiceBroker } from "moleculer"

export default class MfivService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: "mfiv",

      // adapter: new TypeOrmDbAdapter<MethodologyIndex>(configuration.adapter),
      // adapter: connectionInstance(),
      // getConnection("default"),
      // adapter: connectionInstance("index"),

      model: MethodologyIndex,

      // mixins: [DbService],

      settings: {
        $dependencyTimeout: 30000,

        fields: ["timestamp", "value", "methodology", "interval", "baseCurrency", "exchange", "symbolType", "extra"],

        idField: "timestamp"
      },

      // dependencies: [
      //   {
      //     name: "ingest"
      //   }
      // ],

      metadata: {
        scalable: true
      },

      events: {
        "mfiv.14d.ETH.estimate": {
          handler(this: MfivService, context: Context<MfivEvent>) {
            this.logger.info("Hello World")
          }
        }
      }
      // methods: {}
    })
  }
}
