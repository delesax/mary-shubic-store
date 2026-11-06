"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}

/**
 * Fetches available locales from the backend.
 * Returns null if the endpoint returns 404 (locales not configured).
 *
 * Our Medusa backend has no /store/locales route, so the request 404ed on every
 * render (failed responses are not cached). It is now opt-in: set the server-only
 * env var MEDUSA_LOCALES_ENABLED=true once locales exist in Medusa. While it is
 * unset this returns null, which hides the language picker exactly as the 404 did.
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  if (process.env.MEDUSA_LOCALES_ENABLED !== "true") {
    return null
  }

  const next = {
    ...(await getCacheOptions("locales")),
  }

  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ locales }) => locales)
    .catch(() => null)
}
