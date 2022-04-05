import {
  Disconnect,
  MapperFactory,
  NormalizedData,
  normalizeOptionsSummary,
  normalizeTrades,
  ReplayNormalizedOptions,
  StreamNormalizedOptions
} from "tardis-dev"

export type WithDataType = {
  dataTypes: string[]
}

export type ReplayNormalizedOptionsWithDataType = ReplayNormalizedOptions<any, any> & WithDataType

export type ReplayNormalizedRequestOptions = ReplayNormalizedOptionsWithDataType | ReplayNormalizedOptionsWithDataType[]

export type StreamNormalizedOptionsWithDataType = StreamNormalizedOptions<any, any> & WithDataType

export type StreamNormalizedRequestOptions = StreamNormalizedOptionsWithDataType | StreamNormalizedOptionsWithDataType[]

export function* getNormalizers(dataTypes: string[]): IterableIterator<MapperFactory<any, any>> {
  if (dataTypes.includes("trade") || dataTypes.some(dataType => dataType.startsWith("trade_bar_"))) {
    yield normalizeTrades
  }

  if (dataTypes.includes("option_summary")) {
    yield normalizeOptionsSummary
  }
}

function getRequestedDataTypes(options: ReplayNormalizedOptionsWithDataType | StreamNormalizedOptionsWithDataType) {
  return options.dataTypes.map(dataType => {
    if (dataType.startsWith("trade_bar_")) {
      return "trade_bar"
    }
    if (dataType.startsWith("book_snapshot_")) {
      return "book_snapshot"
    }

    if (dataType.startsWith("quote")) {
      return "book_snapshot"
    }

    return dataType
  })
}

export function constructDataTypeFilter(
  options: (ReplayNormalizedOptionsWithDataType | StreamNormalizedOptionsWithDataType)[]
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const requestedDataTypesPerExchange = options.reduce((prev, current) => {
    if (prev[current.exchange] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      prev[current.exchange] = [...prev[current.exchange], ...getRequestedDataTypes(current)]
    } else {
      prev[current.exchange] = getRequestedDataTypes(current)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return prev
  }, {} as any)

  const returnDisconnectMessages = options.some(o => o.withDisconnectMessages)

  return (message: NormalizedData | Disconnect) => {
    if (message.type === "disconnect" && returnDisconnectMessages) {
      return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return requestedDataTypesPerExchange[message.exchange].includes("message.type")
  }
}

export const wait = (delayMS: number) => new Promise(resolve => setTimeout(resolve, delayMS))

// eslint-disable-next-line @typescript-eslint/unbound-method
const oldToISOString = Date.prototype.toISOString

// if Date provides microseconds add those to ISO date
Date.prototype.toISOString = function () {
  if (this.μs !== undefined) {
    const isoString = oldToISOString.apply(this)

    return isoString.slice(0, isoString.length - 1) + this.μs.toString().padStart(3, "0") + "Z"
  }
  return oldToISOString.apply(this)
}

/**
 * Expects a string set in the environment in the form of:
 * INGEST_CONTRACT_TYPE=call_option,put_option
 * @param contractType csv string
 * @returns an array of contractType strings
 */
export const parseContractType = (contractType?: string, defaultContractType = ["call_option", "put_option"]) =>
  contractType ? contractType.split(",") : defaultContractType
