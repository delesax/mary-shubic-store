"use client"

import { useActionState } from "react"
import { subscribeToNewsletter, NewsletterState } from "@lib/data/newsletter"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Drop-in replacement for the "Your email / JOIN" box in the footer.
export default function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    subscribeToNewsletter,
    null
  )

  if (state?.ok) {
    return (
      <p role="status" className="text-sm text-ink/70">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-y-2" noValidate>
      <div className="flex items-center border-b border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email"
          required
          className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
        {/* honeypot: hidden from people, filled in by bots */}
        <input
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <button
          type="submit"
          disabled={pending}
          className="py-2 pl-3 text-xs font-semibold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {pending ? "..." : "Join"}
        </button>
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-xs text-wine">
          {state.message}
        </p>
      )}
      <p className="text-xs leading-relaxed text-ink/50">
        By joining you agree to receive Mary Shubic emails. Unsubscribe any
        time. See our{" "}
        <LocalizedClientLink href="/privacy-policy" className="underline">
          Privacy Policy
        </LocalizedClientLink>
        .
      </p>
    </form>
  )
}
