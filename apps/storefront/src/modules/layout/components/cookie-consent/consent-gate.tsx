"use client"

import {
  CONSENT_CHANGED_EVENT,
  CONSENT_KEY,
  isAllowed,
  readConsent,
  type ConsentCategory,
} from "@lib/util/cookie-consent"
import { useSyncExternalStore, type ReactNode } from "react"

const subscribe = (onChange: () => void) => {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange)
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY || e.key === null) onChange()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange)
    window.removeEventListener("storage", onStorage)
  }
}

// true only once the visitor has accepted this category; always false on the server
export const useConsent = (category: ConsentCategory): boolean =>
  useSyncExternalStore(
    subscribe,
    () => isAllowed(readConsent(), category),
    () => false
  )

// Wrap any optional script or widget in this. Nothing inside loads until consent is given
// (analytics or marketing), and it unmounts again if the visitor withdraws it.
// No analytics or marketing is in use today.
export default function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory
  children: ReactNode
}) {
  const allowed = useConsent(category)

  return allowed ? <>{children}</> : null
}
