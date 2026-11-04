"use server"

import { sdk } from "@lib/config"
import {
  classifyResetError,
  FORGOT_PASSWORD_MESSAGE,
  isValidEmail,
  normalizeEmail,
  requestFailedWithClientError,
  validateNewPassword,
} from "@lib/util/password-reset"

export type PasswordResetState = { ok: boolean; message: string } | null

// Step 1: the customer asks for a link. Medusa emails it (the auth.password_reset
// subscriber in the backend). The answer never reveals whether the account exists.
export async function requestPasswordReset(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  // Honeypot: people never fill this hidden field, bots usually do
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true, message: FORGOT_PASSWORD_MESSAGE }
  }

  const email = normalizeEmail(formData.get("email"))
  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
  } catch (error) {
    // A 4xx (for example "no such account") gets the same answer as success. Only a real
    // outage is reported, and the email address is not logged.
    if (!requestFailedWithClientError(error)) {
      console.error("password reset request failed: service unavailable")
      return {
        ok: false,
        message: "Something went wrong. Please try again in a moment.",
      }
    }
  }

  return { ok: true, message: FORGOT_PASSWORD_MESSAGE }
}

// Step 2: the customer chose a new password on the page the email linked to. The token
// comes from that link and is never logged.
export async function submitNewPassword(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const token = String(formData.get("token") ?? "").trim()
  const email = normalizeEmail(formData.get("email"))
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!token) {
    return {
      ok: false,
      message: "This link is not valid. Please request a new one.",
    }
  }

  const problem = validateNewPassword(password, confirm)
  if (problem) {
    return { ok: false, message: problem }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )
  } catch (error) {
    if (classifyResetError(error) === "invalid_link") {
      return {
        ok: false,
        message:
          "This link has expired or has already been used. Please request a new one.",
      }
    }
    console.error("password reset failed: service unavailable")
    return {
      ok: false,
      message: "Something went wrong. Please try again in a moment.",
    }
  }

  return {
    ok: true,
    message: "Your password has been changed. You can now sign in.",
  }
}
