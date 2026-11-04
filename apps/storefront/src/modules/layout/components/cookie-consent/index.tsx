"use client"

import {
  acceptAll,
  buildChoice,
  CONSENT_CHANGED_EVENT,
  OPEN_SETTINGS_EVENT,
  readConsent,
  rejectAll,
  saveConsent,
  type ConsentChoice,
} from "@lib/util/cookie-consent"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useRef, useState } from "react"

// Accept and Reject share one style so neither is more prominent than the other.
const CHOICE_BUTTON =
  "flex-1 min-h-[44px] border border-ink bg-ivory px-4 py-2 text-xs font-body font-semibold uppercase tracking-widest text-ink hover:bg-blush transition-colors duration-200"

const LINK_BUTTON =
  "min-h-[44px] text-xs font-body underline text-ink hover:text-wine"

type Mode = "hidden" | "banner" | "preferences"

// Consent banner. Only strictly necessary cookies run until the visitor accepts. The
// choice is stored in this browser (localStorage) and can be reopened from the footer.
export default function CookieConsent() {
  const [mode, setMode] = useState<Mode>("hidden")
  const [hasChoice, setHasChoice] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // First visit: no saved choice, so ask. Otherwise stay out of the way.
  useEffect(() => {
    const saved = readConsent()
    setHasChoice(!!saved)
    setAnalytics(saved?.analytics ?? false)
    setMarketing(saved?.marketing ?? false)
    if (!saved) {
      setMode("banner")
    }
  }, [])

  // The footer "Cookie settings" button reopens the preferences
  useEffect(() => {
    const open = () => {
      const saved = readConsent()
      setAnalytics(saved?.analytics ?? false)
      setMarketing(saved?.marketing ?? false)
      setMode("preferences")
    }
    window.addEventListener(OPEN_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open)
  }, [])

  // Move keyboard focus to the heading when the preferences panel opens
  useEffect(() => {
    if (mode === "preferences") {
      headingRef.current?.focus()
    }
  }, [mode])

  const commit = (choice: ConsentChoice) => {
    saveConsent(choice)
    setAnalytics(choice.analytics)
    setMarketing(choice.marketing)
    setHasChoice(true)
    setMode("hidden")
  }

  if (mode === "hidden") {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      data-testid="cookie-consent"
      className="fixed inset-x-4 bottom-4 z-[90] flex max-h-[85vh] flex-col gap-4 overflow-y-auto border border-ink/15 bg-ivory p-5 text-ink shadow-lg small:left-auto small:right-6 small:w-[28rem]"
    >
      {mode === "banner" && (
        <>
          <h2
            id="cookie-consent-title"
            className="font-display text-lg italic text-wine-deep"
          >
            Cookies
          </h2>
          <p className="text-sm leading-relaxed">
            We use only the cookies needed to run the shop: your bag, checkout,
            sign-in and security. Optional cookies, such as analytics or
            marketing, stay off unless you accept them. We do not use any
            optional cookies at the moment.
          </p>
          <div className="flex flex-col gap-3 small:flex-row">
            <button
              type="button"
              className={CHOICE_BUTTON}
              onClick={() => commit(acceptAll())}
              data-testid="cookie-accept"
            >
              Accept all
            </button>
            <button
              type="button"
              className={CHOICE_BUTTON}
              onClick={() => commit(rejectAll())}
              data-testid="cookie-reject"
            >
              Reject non-essential
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-5">
            <button
              type="button"
              className={LINK_BUTTON}
              onClick={() => setMode("preferences")}
              data-testid="cookie-manage"
            >
              Manage preferences
            </button>
            <LocalizedClientLink href="/cookie-policy" className={LINK_BUTTON + " inline-flex items-center"}>
              Cookie policy
            </LocalizedClientLink>
          </div>
        </>
      )}

      {mode === "preferences" && (
        <>
          <h2
            id="cookie-consent-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-lg italic text-wine-deep focus:outline-none"
          >
            Cookie preferences
          </h2>

          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <input
                id="cookie-necessary"
                type="checkbox"
                checked
                disabled
                className="mt-1 h-5 w-5 accent-wine"
              />
              <label htmlFor="cookie-necessary" className="text-sm leading-relaxed">
                <span className="block font-semibold">Strictly necessary</span>
                Always on. Needed for your bag, checkout, sign-in, language
                choice and security.
              </label>
            </li>
            <li className="flex items-start gap-3">
              <input
                id="cookie-analytics"
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 h-5 w-5 accent-wine"
                data-testid="cookie-analytics"
              />
              <label htmlFor="cookie-analytics" className="text-sm leading-relaxed">
                <span className="block font-semibold">Analytics</span>
                Helps us see how the shop is used. None in use at the moment;
                your choice applies if we add any.
              </label>
            </li>
            <li className="flex items-start gap-3">
              <input
                id="cookie-marketing"
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 h-5 w-5 accent-wine"
                data-testid="cookie-marketing"
              />
              <label htmlFor="cookie-marketing" className="text-sm leading-relaxed">
                <span className="block font-semibold">Marketing</span>
                Used to show relevant offers. None in use at the moment; your
                choice applies if we add any.
              </label>
            </li>
          </ul>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className={CHOICE_BUTTON}
              onClick={() => commit(buildChoice({ analytics, marketing }))}
              data-testid="cookie-save"
            >
              Save preferences
            </button>
            <div className="flex flex-col gap-3 small:flex-row">
              <button
                type="button"
                className={CHOICE_BUTTON}
                onClick={() => commit(acceptAll())}
              >
                Accept all
              </button>
              <button
                type="button"
                className={CHOICE_BUTTON}
                onClick={() => commit(rejectAll())}
              >
                Reject non-essential
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5">
            {hasChoice && (
              <button
                type="button"
                className={LINK_BUTTON}
                onClick={() => setMode("hidden")}
                data-testid="cookie-cancel"
              >
                Close without changes
              </button>
            )}
            <LocalizedClientLink href="/cookie-policy" className={LINK_BUTTON + " inline-flex items-center"}>
              Cookie policy
            </LocalizedClientLink>
          </div>
        </>
      )}
    </div>
  )
}
