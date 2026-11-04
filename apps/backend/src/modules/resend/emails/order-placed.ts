// Plain-HTML email template (no React). The monorepo has React 19 (storefront)
// and React 18 (Medusa admin) side by side, so rendering email with React in the
// backend risks mixing two React copies. A string template avoids that entirely.

import {
  addressLines,
  BRAND,
  esc,
  money,
  summaryRow,
  type Address,
  type Money,
  type OrderItem,
  type RenderedEmail,
  type ShippingMethod,
} from "./shared"

// Re-exported so the notification provider keeps importing it from here
export type { RenderedEmail } from "./shared"

export type OrderPlacedEmailProps = {
  order: {
    id: string
    display_id: number
    currency_code: string
    total: Money
    item_total: Money
    tax_total: Money
    items?: OrderItem[]
    shipping_address?: Address | null
    shipping_methods?: ShippingMethod[]
  }
}

export function renderOrderPlacedEmail({ order }: OrderPlacedEmailProps): RenderedEmail {
  const currency = order.currency_code
  const address = order.shipping_address
  const firstName = address?.first_name?.trim()
  const showTax = Number(order.tax_total ?? 0) > 0
  const items = order.items ?? []
  const shippingMethods = order.shipping_methods ?? []
  const lines = addressLines(address)

  const logo = BRAND.logoUrl
    ? `<img src="${esc(BRAND.logoUrl)}" width="160" alt="${esc(BRAND.name)}" style="display:block;margin:0 auto;border:0;height:auto;">`
    : `<span style="color:${BRAND.accent};">${esc(BRAND.name)}</span>`

  const heading = firstName ? `Thank you, ${firstName}` : "Thank you for your order"
  const intro = `We've received order #${order.display_id} and will email you again when it ships.`

  const itemRows = items
    .map((item) => {
      const variant =
        item.variant_title && item.variant_title !== "Default variant"
          ? `<div style="margin-top:2px;font-size:13px;color:${BRAND.muted};">${esc(item.variant_title)}</div>`
          : ""
      const thumb = item.thumbnail
        ? `<td width="88" valign="top" style="padding:0 16px 16px 0;"><img src="${esc(item.thumbnail)}" width="72" alt="${esc(item.product_title ?? "Item")}" style="display:block;border:0;height:auto;"></td>`
        : ""
      return `<tr>
  ${thumb}
  <td valign="top" style="padding:0 0 16px 0;font-size:15px;color:${BRAND.ink};">
    <div style="font-weight:600;">${esc(item.product_title)}</div>
    ${variant}
    <div style="margin-top:2px;font-size:13px;color:${BRAND.muted};">Qty ${esc(item.quantity)}</div>
  </td>
  <td valign="top" align="right" style="padding:0 0 16px 16px;font-size:15px;color:${BRAND.ink};">${esc(money(item.total, currency))}</td>
</tr>`
    })
    .join("\n")

  const shippingRows = shippingMethods
    .map((m) => summaryRow(m.name?.trim() || "Shipping", money(m.total, currency)))
    .join("\n")

  const addressBlock = lines.length
    ? `<tr><td style="padding-top:24px;border-top:1px solid ${BRAND.rule};">
  <div style="font-size:13px;font-weight:600;color:${BRAND.ink};margin:24px 0 6px;">Shipping to</div>
  <div style="font-size:13px;line-height:20px;color:${BRAND.muted};">${lines.map(esc).join("<br>")}</div>
</td></tr>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(BRAND.name)} order #${esc(order.display_id)}</title>
</head>
<body style="margin:0;padding:24px 0;background:${BRAND.background};font-family:${BRAND.fontStack};color:${BRAND.ink};">
<div style="display:none;max-height:0;overflow:hidden;">Thank you for your order #${esc(order.display_id)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.paper};">
<tr><td style="padding:32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="font-size:20px;letter-spacing:0.18em;text-transform:uppercase;padding-bottom:24px;border-bottom:1px solid ${BRAND.rule};">${logo}</td></tr>
    <tr><td style="padding-top:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;">${esc(heading)}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.muted};">${esc(intro)}</p>
    </td></tr>
    <tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemRows}
      </table>
    </td></tr>
    <tr><td style="border-top:1px solid ${BRAND.rule};padding-top:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${summaryRow("Subtotal", money(order.item_total, currency))}
        ${shippingRows}
        ${showTax ? summaryRow("Tax", money(order.tax_total, currency)) : ""}
        ${summaryRow("Total", money(order.total, currency), true, BRAND.accent)}
      </table>
    </td></tr>
    ${addressBlock}
    <tr><td style="padding-top:24px;border-top:1px solid ${BRAND.rule};margin-top:24px;">
      <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};text-align:center;">
        Questions about your order? Reply to this email or write to
        <a href="mailto:${esc(BRAND.supportEmail)}" style="color:${BRAND.accent};">${esc(BRAND.supportEmail)}</a>.
      </p>
      <p style="margin:8px 0 0;font-size:12px;text-align:center;">
        <a href="${esc(BRAND.siteUrl)}" style="color:${BRAND.muted};">${esc(BRAND.name)}</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    `${BRAND.name}`,
    "",
    heading,
    intro,
    "",
    ...items.map(
      (item) =>
        `${item.product_title ?? "Item"}${
          item.variant_title && item.variant_title !== "Default variant"
            ? ` (${item.variant_title})`
            : ""
        } x${item.quantity}  ${money(item.total, currency)}`
    ),
    "",
    `Subtotal: ${money(order.item_total, currency)}`,
    ...shippingMethods.map(
      (m) => `${m.name?.trim() || "Shipping"}: ${money(m.total, currency)}`
    ),
    ...(showTax ? [`Tax: ${money(order.tax_total, currency)}`] : []),
    `Total: ${money(order.total, currency)}`,
    ...(lines.length ? ["", "Shipping to:", ...lines] : []),
    "",
    `Questions? Reply to this email or write to ${BRAND.supportEmail}.`,
    BRAND.siteUrl,
  ].join("\n")

  return { html, text }
}