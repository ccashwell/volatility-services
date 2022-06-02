/* eslint-disable prettier/prettier */
"use strict"
import { ensure } from "@lib/utils/ensure"
import Moleculer, { BrokerOptions, Errors, LogLevels } from "moleculer"
import newrelic from "newrelic"
import "reflect-metadata"
import { AppDataSource } from "./src/datasources/datasource"

const logLevel = (process.env.LOGLEVEL ?? "info") as LogLevels
const colors = process.env.LOG_COLORS === "true" || false
/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options:
 *     https://moleculer.services/docs/0.14/configuration.html
 *
 *
 * Overwriting options in production:
 * ================================
 *    You can overwrite any option with environment variables.
 *    For example to overwrite the "logLevel" value, use `LOGLEVEL=warn` env var.
 *    To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 *    To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.js",
 *    use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 *    For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as `MOL_CACHER__OPTIONS__PREFIX=mycache`.
 *  It will set this:
 *  {
 *    cacher: {
 *      options: {
 *        prefix: "mycache"
 *      }
 *    }
 *  }
 */
const brokerConfig: BrokerOptions = {
  // Namespace of nodes to segment your nodes on the same network.
  namespace: "volatility-services",
  // Unique node identifier. Must be unique in a namespace.
  nodeID: undefined,
  // Custom metadata store. Store here what you want. Accessing: `this.broker.metadata`
  metadata: {},

  // Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.14/logging.html
  // Available logger types: "Console", "File", "Pino", "Winston", "Bunyan", "debug", "Log4js", "Datadog"
  logger: {
    type: "Console",
    options: {
      // Using colors on the output
      colors,
      // Print module names with different colors (like docker-compose for containers)
      moduleColors: colors,
      // Line formatter. It can be "json", "short", "simple", "full", a `Function` or a template string like "{timestamp} {level} {nodeID}/{mod}: {msg}"
      formatter: "full",
      // Custom object printer. If not defined, it uses the `util.inspect` method.
      objectPrinter: null,
      // Auto-padding the module name in order to messages begin at the same column.
      autoPadding: process.env.NODE_ENV !== "production"

      // log4js: {
      //   appenders: { app: { type: "stdout" } },
      //   // appenders: {
      //   //   app: { type: "file", filename: "./logs/application.log" }
      //   // },
      //   categories: {
      //     default: { appenders: ["app"], level: logLevel }
      //   }
      // }
    }
  },

  // Default log level for built-in console logger. It can be overwritten in logger options above.
  // Available values: trace, debug, info, warn, error, fatal
  logLevel,

  // Define transporter.
  // More info: https://moleculer.services/docs/0.14/networking.html
  // Note: During the development, you don't need to define it because all services will be loaded locally.
  // In production you can set it via `TRANSPORTER=nats://localhost:4222` environment variable.
  transporter: undefined,

  // Define a cacher.
  // More info: https://moleculer.services/docs/0.14/caching.html
  cacher: "Memory",
  // cacher: {
  //   type: "Redis",
  //   options: {
  //     // Prefix for keys
  //     prefix: "VG",
  //     // set Time-to-live to 30sec.
  //     // ttl: process.env.CACHER_TTL,
  //     // Turns Redis client monitoring on.
  //     monitor: false,
  //     // Redis settings
  //     redis: {
  //       host: "vg-ue2-devplatform-elasticache-redis.zfmhfe.ng.0001.use2.cache.amazonaws.com",
  //       port: 6379
  //       // password: process.env.REDIS_PASSWORD,
  //       // db: process.env.REDIS_DB ?? 0
  //     }
  //   }
  // },

  // Define a serializer.
  // Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
  // More info: https://moleculer.services/docs/0.14/networking.html#Serialization
  serializer: "JSON",

  // Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
  requestTimeout: 10 * 1000,

  // Retry policy settings. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Retry
  retryPolicy: {
    // Enable feature
    enabled: true,
    // Count of retries
    retries: 3,
    // First delay in milliseconds.
    delay: 100,
    // Maximum delay in milliseconds.
    maxDelay: 1000,
    // Backoff factor for delay. 2 means exponential backoff.
    factor: 2,
    // A function to check failed requests.
    check: (err: Error) => err && err instanceof Errors.MoleculerRetryableError && !!err.retryable
  },

  // Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error. (Infinite loop protection)
  maxCallLevel: 100,

  // Number of seconds to send heartbeat packet to other nodes.
  heartbeatInterval: 10,
  // Number of seconds to wait before setting node to unavailable status.
  heartbeatTimeout: 120,

  // Cloning the params of context if enabled. High performance impact, use it with caution!
  contextParamsCloning: false,

  // Tracking requests and waiting for running requests before shuting down. More info: https://moleculer.services/docs/0.14/context.html#Context-tracking
  tracking: {
    // Enable feature
    enabled: true,
    // Number of milliseconds to wait before shuting down the process.
    shutdownTimeout: 10000
  },

  // Disable built-in request & emit balancer. (Transporter must support it, as well.). More info: https://moleculer.services/docs/0.14/networking.html#Disabled-balancer
  disableBalancer: false,

  // Settings of Service Registry. More info: https://moleculer.services/docs/0.14/registry.html
  registry: {
    // Define balancing strategy. More info: https://moleculer.services/docs/0.14/balancing.html
    // Available values: "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"
    strategy: "RoundRobin",
    // Enable local action call preferring. Always call the local action instance if available.
    preferLocal: false
  },

  // Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Circuit-Breaker
  circuitBreaker: {
    // Enable feature
    enabled: false,
    // Threshold value. 0.5 means that 50% should be failed for tripping.
    threshold: 0.5,
    // Minimum request count. Below it, CB does not trip.
    minRequestCount: 20,
    // Number of seconds for time window.
    windowTime: 60,
    // Number of milliseconds to switch from open to half-open state
    halfOpenTime: 10 * 1000,
    // A function to check failed requests.
    check: err => err && true // err.code >= 500
  },

  // Settings of bulkhead feature. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Bulkhead
  bulkhead: {
    // Enable feature.
    enabled: false,
    // Maximum concurrent executions.
    concurrency: 10,
    // Maximum size of queue
    maxQueueSize: 100
  },

  // Enable action & event parameter validation. More info: https://moleculer.services/docs/0.14/validating.html
  validator: true,

  // errorHandler: (err: Error, info: unknown) => {
  //   const message = "Unhandled exception in volatility-services/moleculer.config"
  //   const type = "mol:unhandled_exception"

  //   // Emit a structured error so it can be easily ingested
  //   const payload = {
  //     type,
  //     message,
  //     error: {
  //       name: err.name,
  //       message: err.message,
  //       details: err.stack
  //     }
  //     // info
  //     // info,
  //     // git: pkg.repository as string
  //   }

  //   console.error("unhandled exception", payload)
  //   if (info) {
  //     console.error("extra info:", info)
  //   }

  //   // noticeError(err, { message, type })

  //   // console.error(payload)
  //   // console.error(JSON.stringify(payload, null, 2))
  //   // console.error(`*** NOTICE ***: ${err.name} ***\n`, err.stack)
  //   // console.error(`*** message: ${err.message}`)
  //   // if (info !== undefined) {
  //   //   console.error(">>> info:")
  //   //   console.error(info)
  //   // }
  //   // console.error(`*** END: ${err.name} ***`)
  //   // throw err
  // }, //moleculerErrorHandler(this.logger),

  // Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
  metrics: {
    enabled: false
    // reporter: [new VolNewRelicReporter()]

    // Available built-in reporters: "Console", "CSV", "Event", "Prometheus", "Datadog", "StatsD"
    // reporter: {
    //   type: "Prometheus",
    //   options: {
    //     // HTTP port
    //     port: 3090,
    //     // HTTP URL path
    //     path: "/metrics",
    //     // Default labels which are appended to all metrics labels
    //     defaultLabels: (registry: MetricRegistry) => ({
    //       namespace: registry.broker.namespace,
    //       nodeID: registry.broker.nodeID
    //     })
    //   }
    // }
  },

  // Enable built-in tracing function. More info: https://moleculer.services/docs/0.14/tracing.html
  tracing: {
    enabled: process.env.NODE_ENV === "production",
    // Available built-in exporters: "Console", "Datadog", "Event", "EventLegacy", "Jaeger", "Zipkin"
    exporter: {
      type: "NewRelic", // Console exporter is only for development!
      options: {
        // Base URL for NewRelic server
        baseURL: "https://trace-api.newrelic.com",
        // NewRelic Insert Key
        insertKey: "ba2e72fd105fd15c4f15fa19c8c86370FFFFNRAL",
        // Sending time interval in seconds.
        interval: 5,
        // Additional payload options.
        payloadOptions: {
          // Set `debug` property in payload.
          debug: false,
          // Set `shared` property in payload.
          shared: false
        },
        // Default tags. They will be added into all span tags.
        defaultTags: null
      }
    }
  },

  internalServices: true,
  // Register internal middlewares. More info: https://moleculer.services/docs/0.14/middlewares.html#Internal-middlewares
  internalMiddlewares: true,

  // Register custom middlewares
  middlewares: [],

  // Register custom REPL commands.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  replCommands: undefined, // require("./repl-commands")
  // Called after broker created.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  created: (broker: Moleculer.ServiceBroker): void => {
    newrelic.addCustomAttribute("Stage", ensure("stage"))
    newrelic.addCustomAttribute("Environment", ensure("environment"))

    AppDataSource.initialize()
      .then(() => {
        broker.logger.info("DB initialized")
      })
      .catch((err: unknown) => {
        broker.fatal("DB bootstrap failed", err as Error, true)
      })
  },
  // Called after broker started.
  // started: async (broker: Moleculer.ServiceBroker): Promise<void> => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  // Called after broker stopped.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  // stopped: async (broker: Moleculer.ServiceBroker): Promise<void> => {}
  started(broker: Moleculer.ServiceBroker): Promise<void> {
    broker.logger.info("Broker started")
    return Promise.resolve()
    //   // AppDataSource.initialize()
    //   //   .then(datasource => {
    //   //     console.info("Database initialized")
    //   //     return
    //   //   })
    //   //   .catch(err => console.error("Database initialization failed", err))
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  stopped(): void {
    return void AppDataSource.destroy().catch(err => console.error("Database Destroy Error", err))
  }
}

export = brokerConfig
