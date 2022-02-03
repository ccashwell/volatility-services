[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# volatility-mfiv-index

This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Usage

Start the project with `npm run dev` command.
After starting, open the http://localhost:3000/ URL in your browser.
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

In the terminal, try the following commands:

- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.

## Services

## Mixins

- **db.mixin**: Database access mixin for services. Based on [moleculer-db](https://github.com/moleculerjs/moleculer-db#readme)

## Useful links

- Moleculer website: https://moleculer.services/
- Moleculer Documentation: https://moleculer.services/docs/0.14/

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose

## Programming Guide

volatility-services is a microservices architecture living in a mono-repo. The backend services are partitioned in the following way:

* cron.service - set a schedule for when tasks should be performed. Writing indice values every 5 minutes to IPFS is a result of a cronjob.
* index.service - repository for index values. MFIV values are sent here to be recorded by the DB
* ingest.service - read data from tardis/exchanges and transform it to fit our data model. The data stream is cached in-memory. This service is queried for an options list when calculating MFIV.
* instrument_info.service - tracks the available instruments that tardis has to offer. This service is queried for the symbol IDs using expirationDate when determining what options to ingest.
* ipfs.service - this service can take in an object and persist it to IPFS along with creating a DB record so we have an audit trail of our data. IPFS support is backed by fleek.co
* rate.service - this service is backed by aave and returns the liquidity rate of their v2 lending pool smart contract. This value is used for calculating MFIV and is persisted to the DB.
* ws.service - this is the websocket gateway that clients receive published messages from. It can also act as the API gateway until we decide to split the API gateway into its own service.
* bs.service - this is for blob storage/archiving of data for when IPFS or a DB isn't the right storage solution. This is currently backed by s3 with DB records for indexing.
* account.service - this is for user account management. it uses passport.js as the auth framework. it supports username/password login, magic-link/passwordless auth, as well as basic 2fa verification via sms with a dependency on twilio.
* token.service - this mints access tokens for users to authorize use of the websocket gateway etc. It can also mint tokens for service accounts using JWTs.
* mail.service - (status: lower priority) send email campaigns and one-off emails for reset password etc using email templates.

### Interfaces

Each service is split into 3 interfaces: XXXParams, XXXResponse, XXXMeta. For example, the ipfs service has top level module `IIPFS` that contains `IIPFS.StoreParams` and `IIPFS.StoreResponse`.

```
export interface StoreParams {
  key: string
  data: Buffer
  metadata: {
    fileSize: number
    mimeType: string
    requestId: string
  }
}

export interface StoreResponse {
  hash: string
  key: string
}
```

When storing data in IPFS either through the REST or NATS interface you use `IIPFS.StoreParams` as the input to the `store` action. What `ipfs.service.store(params)` returns is a `Promise<StoreResponse>`.  Every service and action follow the convention of providing Params/Response interfaces.

TODO: Document Meta interface

To make it easier to call actions from other services, each service has 'helper' functions:

```
import IngestHelper from "@service_helpers/ingest_helper"

// inside the service somewhere:
const options = await IngestHelper.optionSummariesLists(context, params)
```

These helpers hide lower level details of using the service broker to make RPC calls. These helpers can also be used in the moleculer repl to simplify service-to-service calls. For example, to create a new account and mint an access token:

```
> const newAccount = await AccountHelper.create(context, { username: "joe.eth" })
> const jwtToken = await TokenHelper.create(context, { owner: newAccount, ... })
> const result = await TokenHelper.revoke(context, { token: jwtToken })
```

### Moleculer REPL

TBD
### Events

volatility-services provides a simple event-driven architecture for a select set of events but can be expanded upon as we see fit.

* mfiv.14d.eth.index.created - (*.index.created) - When a new index value has been computed this event is emitted along with `MfivEvent` data.
* account.created - when an account has been newly created, this event is emitted along with `Account` data.

TODO: Provide list of other events we could emit/subscribe
### Websocket

The client facing websocket interface provides a minimal interface for subscribing to messages produced by the platform.

```
import volatility from "volatility-sdk"

// Realtime ethVol
const messages = volatility.realtime("mfiv.14d.eth", options)

// Historical ethVol
const messages = volatility.historical("mfiv.14d.eth", options)

// messages is an AsyncIterableIterator<MfivResult>
await for(const message in messages) {
  console.log(message)
  //
  // Output:
  // {
  //   dVol: 103.82139408011474,
  //   invdVol: 96.31926144512572,
  //   value: "103.82139408011474",
  //   at: "2021-10-01T07:02:00.000Z",
  //   type: "mfiv.14d.eth",
  //   currency: "ETH",
  // }
  //
}
```

Internally, the client will issue an HTTP upgrade to a ws connection via `wss://ws.volatility.com/`.

TODO: Document authentication.

#### Websocket channels/messages

Currently, we only support the "mfiv.14d.eth" channel but there are a handful of other channels we will most likely want to add:

* announcements - get news/alerts/informational messages produced by volatility
* chat - for now, customer support issues
* events - publish platform events such as disputes, proposals, putting values on-chain etc. Could be used to get paginated IPFS hashes

All channels/messages require authentication currently but can be toggled as needed.

The client can call `unsubscribe` to stop receiving a given stream of messages.
#### Heartbeating

The websocket interface requires a client heartbeat to prevent the client from being disconnected. The client MUST send data to the server within any given 5 second span or else the server will close the connection. If the client is not actively sending data, a PING message MUST be sent. Upon success, the server will respond with a PONG response. Otherwise, the client will receive a disconnect message and must reconnect (along with re-authenticate).

#### Sequence Numbers

Sequence numbers are increasing integer values for each connection with every new message being exactly 1 sequence number greater than the one before it.

If you see a sequence number that is more than one value from the previous, it means a message has been dropped. A sequence number less than one you have seen can be ignored or has arrived out-of-order. In both situations you may need to perform logic to make sure your system is in the correct state.

While a websocket connection is over TCP, the websocket servers receive market data in a manner which can result in dropped messages. The client should either be designed to expect and handle sequence gaps and out-of-order messages, or use channels that guarantee delivery of messages.

The sequence number is part of the outer message envelope and is normally handled by the client instead of being exposed to the user. Currently, no effort is made to recover dropped messages.



