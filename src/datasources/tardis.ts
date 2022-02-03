import { init } from "tardis-dev"
import secrets from "src/lib/utils/secrets"

/**
 * Bootstrap the tardis api with credentials
 *
 * @remarks The realtime websocket talks directly to the exchange so this call
 *          isn't required for that. However, it's required for getting the
 *          `instrumentInfo` data.
 * @returns - void
 */
export const initTardis = async () => {
  const secretsJson = await secrets()
  return init({
    apiKey: secretsJson.TARDIS_API_KEY
  })
}
