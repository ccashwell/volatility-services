"use strict"
import { Context, Service, ServiceBroker } from "moleculer"
import { ResultAsync } from "neverthrow"
import { OptionSummary } from "tardis-dev"
import { initTardis } from "../datasources/tardis"
import { stream } from "../datasources/tardis_deribit_streams"
import config from "../configuration"

/**
 * The index service takes in methodology parameters
 * and outputs a methodology value. The parameters
 * map { currentTime, ...expiries } => Map<string, OptionSummary[]> => MethodologyIndexResult
 * to get a map of dates to lists of OptionSummary  input list of options to
 * be used
 * the correct
 */
export default class IngestService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker)
    this.parseServiceSchema({
      // Name
      name: "ingest",

      cacher: "Memory",

      // Settings
      settings: {
        $dependencyTimeout: 30000,
        exchange: config.tardis.exchange
      },
      // Metadata
      metadata: {},
      // Dependencies
      dependencies: [
        {
          name: "instruments",
          version: 1
        }
      ],

      events: {
        "ingest.start": {
          async handler(ctx: Context<{ exchange: "deribit" }>) {
            // await this.ingest(ctx)
          }
        }
      },

      // actions: {
      //   process: {
      //     rest: "/ingest",
      //     async handler(this: IngestService, ctx: Context<{ exchange: "deribit" }>): Promise<void> {
      //       // if (await this.ingest(ctx)) {
      //       //   this.logger.error("Processing of messages unexpectedly failed")
      //       // }
      //       // return Promise.resolve()
      //     }
      //   }
      // },

      // Service methods
      async started(this: IngestService) {
        this.logger.info("Start ingest service")
        await initTardis()
        await this.broker.emit("ingest.start")
        return Promise.resolve()
      }
    })
  }

  private async ingest(ctx: Context<{ exchange: "deribit" }>) {
    return await ResultAsync.fromPromise(
      this.buildInstrumentInfoList(),
      () => new Error("buildInstrumentInfoList() unexpectedly failed")
    )
      .map(symbols => ({
        exchange: ctx.params.exchange,
        symbols
      }))
      .map(stream)
      .map(messages => this.process(messages))
      .unwrapOr(false)
  }

  private async process(messages: AsyncIterableIterator<OptionSummary>) {
    this.logger.info("Process messages.")

    for await (const message of messages) {
      this.logger.info(message)
    }

    return true
  }

  private async buildInstrumentInfoList(this: IngestService): Promise<string[]> {
    this.logger.info("buildInstrumentInfoList()")

    return await this.broker.call("v1.instruments.instrumentInfo", {
      expirationDates: ["2022-01-28T08:00:00.000Z", "2022-02-04T08:00:00.000Z"]
    })
  }
}
