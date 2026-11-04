"use client"

import { requestPasswordReset } from "@lib/data/password-reset"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

// Step 1 of a password reset: ask for the link by email.
const ForgotPassword = () => {
  const [state, formAction] = useActionState(requestPasswordReset, null)

  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="mb-4 font-display text-3xl italic text-ink">
        Reset your password
      </h1>

      {state?.ok ? (
        <>
          <p
            role="status"
            className="mb-8 text-center text-base-regular text-ink/65"
            data-testid="forgot-password-sent"
          >
            {state.message}
          </p>
          <LocalizedClientLink
            href="/account"
            className="inline-flex min-h-[44px] items-center text-sm text-wine underline hover:text-wine/80"
          >
            Back to sign in
          </LocalizedClientLink>
        </>
      ) : (
        <>
          <p className="mb-8 text-center text-base-regular text-ink/65">
            Enter the email address you signed up with and we will send you a
            link to choose a new password.
          </p>
          <form className="w-full" action={formAction} noValidate>
            {/* Input links its label with htmlFor={name}, so the id must equal the name */}
            <Input
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              data-testid="forgot-email-input"
            />
            {/* honeypot: hidden from people, filled in by bots */}
            <input
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              aria-label="Leave this field empty"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <div role="alert">
              <ErrorMessage
                error={state && !state.ok ? state.message : null}
                data-testid="forgot-password-error"
              />
            </div>
            <SubmitButton
              data-testid="forgot-password-submit"
              className="mt-6 w-full"
            >
              Send reset link
            </SubmitButton>
          </form>
          <LocalizedClientLink
            href="/account"
            className="mt-6 inline-flex min-h-[44px] items-center text-sm text-wine underline hover:text-wine/80"
          >
            Back to sign in
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default ForgotPassword
