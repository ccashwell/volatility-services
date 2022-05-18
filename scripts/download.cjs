// npm install tardis-dev
// requires node version >=12
const { downloadDatasets, getExchangeDetails } = require("tardis-dev")

;(async () => {
  const exchange = "deribit"
  const exchangeDetails = await getExchangeDetails(exchange)
  const apiKey = process.env.TARDIS_API_KEY

  // iterate over and download all data for every symbol
  for (const symbol of exchangeDetails.datasets.symbols) {
    // alternatively specify dataTypes explicitly ['trades', 'incremental_book_L2', 'quotes'] etc
    // see available options https://docs.tardis.dev/downloadable-csv-files#data-types
    const dataTypes = symbol.dataTypes
    const symbolId = symbol.id

    // const from = symbol.listing // symbol.availableSince
    // const to = symbol.expirationDate // symbol.availableTo
    const from = symbol.availableSince
    const to = symbol.availableTo

    if (symbol.type !== "option" || !symbolId.startsWith("ETH")) {
      continue
    }

    // skip groupped symbols
    if (["PERPETUALS", "SPOT", "FUTURES"].includes(symbolId)) {
      continue
    }

    // if (!symbolId.startsWith("ETH-13MAY22") /*|| !symbolId.startsWith("ETH-20MAY22")*/) {
    //   continue
    // }
    // if (!["ETH-13MAY22", "ETH-20MAY22"].includes(symbolId)) {
    //   continue
    // }

    // console.log(symbol)
    console.log(`Downloading ${exchange} ${dataTypes} for ${symbolId} from ${from} to ${to}`)

    // each CSV dataset format is documented at https://docs.tardis.dev/downloadable-csv-files#data-types
    // see https://docs.tardis.dev/downloadable-csv-files#download-via-client-libraries for full options docs
    // await downloadDatasets({
    //   exchange,
    //   dataTypes,
    //   from,
    //   to,
    //   symbols: [symbolId],
    //   // TODO: set your API key here
    //   apiKey,
    //   //  path where CSV data will be downloaded into
    //   downloadDir: "./datasets"
    // })
  }
})()
