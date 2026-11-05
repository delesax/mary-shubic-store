"use client"

import { OPEN_SETTINGS_EVENT } from "@lib/util/cookie-consent"

// Footer control that reopens the cookie preferences
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
      data-testid="cookie-settings-button"
    >
      Cookie preferences
    </button>
  )
}
