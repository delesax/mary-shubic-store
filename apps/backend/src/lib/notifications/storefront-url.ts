// Builds links to the storefront for emails. The base URL comes from the optional
// STOREFRONT_URL environment variable; with none (or an invalid one) it falls back to the
// public site address. No secret is involved here.
export const DEFAULT_STOREFRONT_URL = "https://www.maryshubic.com"
export const DEFAULT_COUNTRY_CODE = "gb"

// Medusa's reset-password token lives for 15 minutes (see generate-reset-password-token).
export const RESET_TOKEN_MINUTES = 15

export function getStorefrontUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const raw = (env.STOREFRONT_URL ?? "").trim()

  try {
    const url = new URL(raw)
    const local = ["localhost", "127.0.0.1"].includes(url.hostname)

    if (url.protocol === "https:" || (url.protocol === "http:" && local)) {
      return url.origin
    }
  } catch {
    // not a URL: use the default below
  }

  return DEFAULT_STOREFRONT_URL
}

export function buildPasswordResetUrl(input: {
  baseUrl: string
  token: string
  email: string
  countryCode?: string
}): string {
  const country = /^[a-z]{2}$/i.test(input.countryCode ?? "")
    ? (input.countryCode as string).toLowerCase()
    : DEFAULT_COUNTRY_CODE

  const url = new URL(`/${country}/account/reset-password`, input.baseUrl)
  url.searchParams.set("token", input.token)
  url.searchParams.set("email", input.email)

  return url.toString()
}
