"use client"

import { submitNewPassword } from "@lib/data/password-reset"
import { MIN_PASSWORD_LENGTH } from "@lib/util/password-reset"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

const LINK_CLASS =
  "inline-flex min-h-[44px] items-center text-sm text-wine underline hover:text-wine/80"

// Step 2 of a password reset: the page the email link opens (?token=...&email=...).
const ResetPassword = ({
  token,
  email,
}: {
  token?: string
  email?: string
}) => {
  const [state, formAction] = useActionState(submitNewPassword, null)

  // No token in the link: nothing to reset
  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center" data-testid="reset-password-invalid">
        <h1 className="mb-4 font-display text-3xl italic text-ink">
          This link is not valid
        </h1>
        <p className="mb-6 text-center text-base-regular text-ink/65">
          The link may be incomplete, expired or already used. Please request a new one.
        </p>
        <LocalizedClientLink href="/forgot-password" className={LINK_CLASS}>
          Request a new link
        </LocalizedClientLink>
      </div>
    )
  }

  if (state?.ok) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center" data-testid="reset-password-done">
        <h1 className="mb-4 font-display text-3xl italic text-ink">
          Password changed
        </h1>
        <p role="status" className="mb-6 text-center text-base-regular text-ink/65">
          {state.message}
        </p>
        <LocalizedClientLink href="/account" className={LINK_CLASS}>
          Sign in
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center" data-testid="reset-password-page">
      <h1 className="mb-4 font-display text-3xl italic text-ink">
        Choose a new password
      </h1>
      <p className="mb-8 text-center text-base-regular text-ink/65">
        Use at least {MIN_PASSWORD_LENGTH} characters.
      </p>
      <form className="w-full" action={formAction} noValidate>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email ?? ""} />
        <div className="flex w-full flex-col gap-y-2">
          <Input
            id="password"
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            data-testid="reset-password-input"
          />
          <Input
            id="confirm"
            label="Confirm new password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            data-testid="reset-confirm-input"
          />
        </div>
        <div role="alert">
          <ErrorMessage
            error={state && !state.ok ? state.message : null}
            data-testid="reset-password-error"
          />
        </div>
        {state && !state.ok && /expired|not valid/i.test(state.message) && (
          <LocalizedClientLink href="/forgot-password" className={LINK_CLASS + " mt-2"}>
            Request a new link
          </LocalizedClientLink>
        )}
        <SubmitButton data-testid="reset-password-submit" className="mt-6 w-full">
          Change password
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
