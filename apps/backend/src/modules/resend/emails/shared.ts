// Pieces shared by the Mary Shubic email templates (plain HTML strings, no React; see the
// note in order-placed.ts). The brand colours, escaping, money and address helpers are the
// ones the order-placed email has always used, moved here unchanged.

// Colours come from the Mary Shubic design system, as plain hex
// (email clients ignore CSS variables and most web fonts).
export const BRAND = {
  name: "Mary Shubic",
  ink: "#2A1A1D", // Ink: body text
  muted: "#685B5C", // Ink at ~70% on Ivory (a touch darker than the site for small-text legibility)
  accent: "#7A3B44", // Wine Rose: wordmark fallback, links and the order total
  paper: "#FAF3F0", // Ivory: the card
  background: "#F0D9D4", // Soft Blush: the area around the card
  rule: "#E3C7C2", // slightly deeper blush so dividers stay visible on the card
  siteUrl: "https://www.maryshubic.com",
  supportEmail: "support@maryshubic.com", // TODO: confirm the real support address
  // Public https URL of the wine-rose wordmark as a PNG (email clients don't show SVG).
  // Leave empty to fall back to the brand name in Wine Rose text.
  logoUrl: "https://www.maryshubic.com/images/email/3-wordmark-signature-wine-rose-web.png",  
  fontStack: "'Work Sans', Helvetica, Arial, sans-serif",
}

export type Money = number | string | null | undefined

export type OrderItem = {
  id: string
  product_title?: string | null
  variant_title?: string | null
  thumbnail?: string | null
  quantity: number
  total: Money
}

export type Address = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

export type ShippingMethod = {
  id: string
  name?: string | null
  total: Money
}

export type RenderedEmail = { html: string; text: string }

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function money(value: Money, currency: string): string {
  const locale = currency.toLowerCase() === "usd" ? "en-US" : "en-GB"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(value ?? 0))
}

export function addressLines(address?: Address | null): string[] {
  if (!address) return []
  return [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.address_1,
    address.address_2,
    [address.city, address.province].filter(Boolean).join(", "),
    address.postal_code,
    address.country_code?.toUpperCase(),
  ].filter((line): line is string => Boolean(line && String(line).trim()))
}

export function summaryRow(
  label: string,
  value: string,
  bold = false,
  color: string = BRAND.ink
): string {
  const weight = bold ? 700 : 400
  return `<tr>
  <td style="padding:4px 0;font-size:14px;font-weight:${weight};color:${color};">${esc(label)}</td>
  <td align="right" style="padding:4px 0;font-size:14px;font-weight:${weight};color:${color};">${esc(value)}</td>
</tr>`
}

// Only plain web links go into emails (no javascript: or data: URLs).
export function safeUrl(url: unknown): string | null {
  const value = String(url ?? "").trim()
  return /^https?:\/\/[^\s"'<>]+$/i.test(value) ? value : null
}

export function renderLogo(): string {
  return BRAND.logoUrl
    ? `<img src="${esc(BRAND.logoUrl)}" width="160" alt="${esc(BRAND.name)}" style="display:block;margin:0 auto;border:0;height:auto;">`
    : `<span style="color:${BRAND.accent};">${esc(BRAND.name)}</span>`
}

// A button that works in Outlook and Gmail (a table cell with the colour, not a styled link).
export function renderButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;">
  <tr><td align="center" bgcolor="${BRAND.accent}" style="background:${BRAND.accent};">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.paper};text-decoration:none;">${esc(label)}</a>
  </td></tr>
</table>`
}

// The "Questions?" footer used by every email
export function renderFooterRow(): string {
  return `<tr><td style="padding-top:24px;border-top:1px solid ${BRAND.rule};margin-top:24px;">
      <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};text-align:center;">
        Questions about your order? Reply to this email or write to
        <a href="mailto:${esc(BRAND.supportEmail)}" style="color:${BRAND.accent};">${esc(BRAND.supportEmail)}</a>.
      </p>
      <p style="margin:8px 0 0;font-size:12px;text-align:center;">
        <a href="${esc(BRAND.siteUrl)}" style="color:${BRAND.muted};">${esc(BRAND.name)}</a>
      </p>
    </td></tr>`
}

export const FOOTER_TEXT = `Questions? Reply to this email or write to ${BRAND.supportEmail}.\n${BRAND.siteUrl}`

// Page frame: logo, heading, intro, then the template's own <tr> rows, then the footer.
export function renderShell(opts: {
  title: string
  preheader: string
  heading: string
  intro: string
  rows: string
  footerRow?: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:24px 0;background:${BRAND.background};font-family:${BRAND.fontStack};color:${BRAND.ink};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.paper};">
<tr><td style="padding:32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="font-size:20px;letter-spacing:0.18em;text-transform:uppercase;padding-bottom:24px;border-bottom:1px solid ${BRAND.rule};">${renderLogo()}</td></tr>
    <tr><td style="padding-top:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;">${esc(opts.heading)}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.muted};">${esc(opts.intro)}</p>
    </td></tr>
    ${opts.rows}
    ${opts.footerRow ?? renderFooterRow()}
  </table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
