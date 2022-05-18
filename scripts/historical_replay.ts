import { normalizeOptionsSummary, OptionSummary, replayNormalized } from "tardis-dev"

const apiKey = process.env.TARDIS_API_KEY

const nearExpiries = [
  "ETH-1APR22-1500-P",
  "ETH-1APR22-2600-P",
  "ETH-1APR22-2400-P",
  "ETH-1APR22-3000-C",
  "ETH-1APR22-4000-C",
  "ETH-1APR22-2700-C",
  "ETH-1APR22-2200-P",
  "ETH-1APR22-2800-C",
  "ETH-1APR22-2300-P",
  "ETH-1APR22-2500-C",
  "ETH-1APR22-3500-C",
  "ETH-1APR22-2500-P",
  "ETH-1APR22-1000-P",
  "ETH-1APR22-3200-C",
  "ETH-1APR22-2600-C",
  "ETH-1APR22-1800-P",
  "ETH-1APR22-2800-P",
  "ETH-1APR22-2700-P",
  "ETH-1APR22-2000-P",
  "ETH-1APR22-3000-P",
  "ETH-1APR22-3400-C",
  "ETH-1APR22-3200-P",
  "ETH-1APR22-3400-P",
  "ETH-1APR22-2900-C",
  "ETH-1APR22-2900-P",
  "ETH-1APR22-3500-P",
  "ETH-1APR22-3600-C",
  "ETH-1APR22-3100-C",
  "ETH-1APR22-3100-P",
  "ETH-1APR22-3300-C",
  "ETH-1APR22-3300-P",
  "ETH-1APR22-3800-C",
  "ETH-1APR22-3350-C",
  "ETH-1APR22-3350-P",
  "ETH-1APR22-3450-C",
  "ETH-1APR22-3250-P",
  "ETH-1APR22-3250-C",
  "ETH-1APR22-2200-C",
  "ETH-1APR22-2400-C",
  "ETH-1APR22-2300-C",
  "ETH-1APR22-1800-C",
  "ETH-1APR22-1000-C",
  "ETH-1APR22-1500-C",
  "ETH-1APR22-2000-C",
  "ETH-1APR22-4000-P",
  "ETH-1APR22-3600-P",
  "ETH-1APR22-3800-P",
  "ETH-1APR22-3450-P"
]
const nextExpiries = [
  "ETH-1APR22-1500-P",
  "ETH-1APR22-2600-P",
  "ETH-1APR22-2400-P",
  "ETH-1APR22-3000-C",
  "ETH-1APR22-4000-C",
  "ETH-1APR22-2700-C",
  "ETH-1APR22-2200-P",
  "ETH-1APR22-2800-C",
  "ETH-1APR22-2300-P",
  "ETH-1APR22-2500-C",
  "ETH-1APR22-3500-C",
  "ETH-1APR22-2500-P",
  "ETH-1APR22-1000-P",
  "ETH-1APR22-3200-C",
  "ETH-1APR22-2600-C",
  "ETH-1APR22-1800-P",
  "ETH-1APR22-2800-P",
  "ETH-1APR22-2700-P",
  "ETH-1APR22-2000-P",
  "ETH-1APR22-3000-P",
  "ETH-1APR22-3400-C",
  "ETH-1APR22-3200-P",
  "ETH-1APR22-3400-P",
  "ETH-1APR22-2900-C",
  "ETH-1APR22-2900-P",
  "ETH-1APR22-3500-P",
  "ETH-1APR22-3600-C",
  "ETH-1APR22-3100-C",
  "ETH-1APR22-3100-P",
  "ETH-1APR22-3300-C",
  "ETH-1APR22-3300-P",
  "ETH-1APR22-3800-C",
  "ETH-1APR22-3350-C",
  "ETH-1APR22-3350-P",
  "ETH-1APR22-3450-C",
  "ETH-1APR22-3250-P",
  "ETH-1APR22-3250-C",
  "ETH-1APR22-2200-C",
  "ETH-1APR22-2400-C",
  "ETH-1APR22-2300-C",
  "ETH-1APR22-1800-C",
  "ETH-1APR22-1000-C",
  "ETH-1APR22-1500-C",
  "ETH-1APR22-2000-C",
  "ETH-1APR22-4000-P",
  "ETH-1APR22-3600-P",
  "ETH-1APR22-3800-P",
  "ETH-1APR22-3450-P"
]

const messages = replayNormalized(
  {
    apiKey,
    exchange: "deribit",
    symbols: [...nearExpiries, ...nextExpiries],
    from: "2022-03-31T00:00:00.000Z",
    to: "2022-04-02T08:00:00.000Z"
  },
  normalizeOptionsSummary
)

async function process(messages: AsyncIterableIterator<OptionSummary>) {
  console.info("start process")
  for await (const message of messages) {
    if (message.lastPrice === undefined) {
      continue
    }

    console.log(message)
  }
  console.info("finish process")
}

;(async () => {
  process(messages)
})()
