"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Notice for essential-only cookies. No consent is needed for strictly
// necessary cookies, so this just informs. If you ever add analytics or
// advertising cookies, replace this with a real accept/reject consent banner
// and do not load those scripts until the visitor accepts.
const KEY = "ms_cookie_notice_seen"

export default function CookieNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1")
    } catch {}
    setShow(false)
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-[90] flex flex-col gap-3 rounded-[2px] bg-ink px-4 py-3 text-ivory shadow-lg small:left-auto small:right-6 small:w-96"
    >
      <p className="text-xs leading-relaxed">
        We only use essential cookies to run the shop (your bag, checkout and
        security). Read our{" "}
        <LocalizedClientLink href="/cookie-policy" className="underline">
          Cookie Policy
        </LocalizedClientLink>
        .
      </p>
      <button
        onClick={dismiss}
        className="self-start text-xs font-semibold uppercase tracking-widest underline"
      >
        OK
      </button>
    </div>
  )
}
