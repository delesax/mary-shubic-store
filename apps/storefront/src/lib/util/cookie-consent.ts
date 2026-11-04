// Cookie consent state. Only strictly necessary cookies run until the visitor accepts:
// with no saved choice, every optional category is OFF.
export const CONSENT_KEY = "ms_cookie_consent"
export const CONSENT_VERSION = 1 // bump to ask everyone again if the categories change
export const CONSENT_CHANGED_EVENT = "ms:cookie-consent-changed"
export const OPEN_SETTINGS_EVENT = "ms:open-cookie-settings"

// Strictly necessary cookies are always on and are not a choice.
export type ConsentCategory = "analytics" | "marketing"

export type ConsentChoice = {
  version: number
  analytics: boolean
  marketing: boolean
  savedAt: string
}

export const buildChoice = (
  choice: { analytics: boolean; marketing: boolean },
  now: Date = new Date()
): ConsentChoice => ({
  version: CONSENT_VERSION,
  analytics: choice.analytics,
  marketing: choice.marketing,
  savedAt: now.toISOString(),
})

export const acceptAll = (now?: Date) =>
  buildChoice({ analytics: true, marketing: true }, now)

export const rejectAll = (now?: Date) =>
  buildChoice({ analytics: false, marketing: false }, now)

// Anything missing, malformed or from an older version counts as "no choice yet".
export const parseConsent = (raw: string | null | undefined): ConsentChoice | null => {
  if (!raw) {
    return null
  }

  try {
    const value = JSON.parse(raw)

    if (
      value &&
      value.version === CONSENT_VERSION &&
      typeof value.analytics === "boolean" &&
      typeof value.marketing === "boolean"
    ) {
      return {
        version: value.version,
        analytics: value.analytics,
        marketing: value.marketing,
        savedAt: typeof value.savedAt === "string" ? value.savedAt : "",
      }
    }
  } catch {
    // fall through
  }

  return null
}

export const isAllowed = (
  choice: ConsentChoice | null,
  category: ConsentCategory
): boolean => !!choice && choice[category] === true

// Browser storage helpers. Storage can be blocked (private mode), so nothing here throws.
export const readConsent = (): ConsentChoice | null => {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY))
  } catch {
    return null
  }
}

export const saveConsent = (choice: ConsentChoice): void => {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice))
  } catch {
    // The choice still applies for this page view through the event below
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: choice }))
}
