"use server"

// Newsletter sign-up: adds the email to Resend. Runs on the server only, so the
// API key is never sent to the browser.
// Needs RESEND_API_KEY (and optionally RESEND_AUDIENCE_ID) in the storefront
// container's environment.

export type NewsletterState = { ok: boolean; message: string } | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  // Honeypot: real people never fill this hidden field, bots usually do.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true, message: "You're on the list. Thank you!" }
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("newsletter: RESEND_API_KEY is not set")
    return { ok: false, message: "Sign-up is unavailable right now. Please try again later." }
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID
  const url = audienceId
    ? `https://api.resend.com/audiences/${audienceId}/contacts`
    : "https://api.resend.com/contacts"

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
      cache: "no-store",
    })
    if (!res.ok) {
      console.error("newsletter: Resend error", res.status, await res.text())
      return { ok: false, message: "Something went wrong. Please try again." }
    }
  } catch (err) {
    console.error("newsletter: request failed", err)
    return { ok: false, message: "Something went wrong. Please try again." }
  }

  return { ok: true, message: "You're on the list. Thank you!" }
}
