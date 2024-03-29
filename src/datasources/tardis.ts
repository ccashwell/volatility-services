import { init } from "tardis-dev"
/**
 * Bootstrap the tardis api with credentials
 *
 * @remarks The realtime websocket talks directly to the exchange so this call
 *          isn't required for that. However, it's required for getting the
 *          `instrumentInfo` data.
 * @returns - void
 */
export const initTardis = () => {
  // const tardisSecret = await SecretsClient({ secretName: "API_Keys" }).requireRead("TARDIS_API_KEY")

  return init({
    apiKey: process.env.TARDIS_API_KEY
  })
}
