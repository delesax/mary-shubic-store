// Validation and error handling for the forgot-password and reset-password pages.
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export const normalizeEmail = (raw: unknown): string =>
  String(raw ?? "").trim().toLowerCase()

export const isValidEmail = (email: string): boolean =>
  email.length > 0 &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

// Returns an error message to show, or null when the new password is acceptable.
export const validateNewPassword = (
  password: string,
  confirm: string
): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Your password must be no more than ${MAX_PASSWORD_LENGTH} characters.`
  }
  if (password !== confirm) {
    return "The two passwords do not match."
  }
  return null
}

export type ResetErrorKind = "invalid_link" | "unavailable"

const statusOf = (error: unknown): number | undefined => {
  const e = error as { status?: unknown; response?: { status?: unknown } } | null
  const status = e?.status ?? e?.response?.status
  return typeof status === "number" ? status : undefined
}

// A 4xx from Medusa means the token is wrong, expired or already used. No status (the
// network failed) or a 5xx means the service had a problem and the customer can retry.
export const classifyResetError = (error: unknown): ResetErrorKind => {
  const status = statusOf(error)
  return status !== undefined && status >= 400 && status < 500
    ? "invalid_link"
    : "unavailable"
}

export const requestFailedWithClientError = (error: unknown): boolean =>
  classifyResetError(error) === "invalid_link"

// Same wording whether or not an account exists, so the form cannot be used to find out
// which email addresses have accounts.
export const FORGOT_PASSWORD_MESSAGE =
  "If there is an account for that email address, we have sent a link to reset your password. The link works for 15 minutes."
