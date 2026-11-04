// Password reset email. The link is built by the subscriber from the storefront URL and a
// short-lived Medusa reset token (15 minutes); nothing secret is stored in this file.
import {
  BRAND,
  esc,
  renderButton,
  renderShell,
  safeUrl,
  type RenderedEmail,
} from "./shared"

export type PasswordResetEmailProps = {
  resetUrl: string
  expiresInMinutes?: number
  firstName?: string | null
}

export function renderPasswordResetEmail({
  resetUrl,
  expiresInMinutes = 15,
  firstName,
}: PasswordResetEmailProps): RenderedEmail {
  const url = safeUrl(resetUrl)
  if (!url) {
    throw new Error("Password reset email needs a valid http(s) reset link")
  }

  const name = firstName?.trim()
  const heading = name ? `Reset your password, ${name}` : "Reset your password"
  const intro = `We received a request to reset the password for your ${BRAND.name} account. The link works for ${expiresInMinutes} minutes.`

  const rows = `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      ${renderButton(url, "Choose a new password")}
      <p style="margin:16px 0 0;font-size:13px;line-height:20px;color:${BRAND.muted};">If the button does not work, copy this link into your browser:</p>
      <p style="margin:6px 0 0;font-size:13px;line-height:20px;word-break:break-all;"><a href="${esc(url)}" style="color:${BRAND.accent};">${esc(url)}</a></p>
    </td></tr>
    <tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.muted};">If you did not ask for this, you can ignore this email. Your password will not change, and the link stops working on its own.</p>
    </td></tr>`

  const footerRow = `<tr><td style="padding-top:24px;border-top:1px solid ${BRAND.rule};">
      <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};text-align:center;">
        Need help? Write to
        <a href="mailto:${esc(BRAND.supportEmail)}" style="color:${BRAND.accent};">${esc(BRAND.supportEmail)}</a>.
      </p>
      <p style="margin:8px 0 0;font-size:12px;text-align:center;">
        <a href="${esc(BRAND.siteUrl)}" style="color:${BRAND.muted};">${esc(BRAND.name)}</a>
      </p>
    </td></tr>`

  const html = renderShell({
    title: `${BRAND.name} password reset`,
    preheader: `Reset your ${BRAND.name} password`,
    heading,
    intro,
    rows,
    footerRow,
  })

  const text = [
    BRAND.name,
    "",
    heading,
    intro,
    "",
    "Choose a new password:",
    url,
    "",
    "If you did not ask for this, you can ignore this email. Your password will not change, and the link stops working on its own.",
    "",
    `Need help? Write to ${BRAND.supportEmail}.`,
    BRAND.siteUrl,
  ].join("\n")

  return { html, text }
}
