// "Your order has been cancelled" email.
import {
  BRAND,
  esc,
  FOOTER_TEXT,
  money,
  renderShell,
  summaryRow,
  type Address,
  type Money,
  type OrderItem,
  type RenderedEmail,
} from "./shared"

export type OrderCanceledEmailProps = {
  order: {
    id: string
    display_id: number
    currency_code: string
    total: Money
    items?: OrderItem[]
    shipping_address?: Address | null
  }
}

// Copy to confirm with the shop owner: it makes no promise about timing or method
// beyond "back to the original payment method", and only if a payment was taken.
const REFUND_NOTE =
  "If you have already been charged, any refund goes back to your original payment method and can take a few working days to appear."

export function renderOrderCanceledEmail({ order }: OrderCanceledEmailProps): RenderedEmail {
  const currency = order.currency_code
  const firstName = order.shipping_address?.first_name?.trim()
  const items = order.items ?? []
  const heading = firstName ? `Your order was cancelled, ${firstName}` : "Your order has been cancelled"
  const intro = `Order #${order.display_id} has been cancelled.`

  const itemRows = items
    .map((item) => {
      const variant =
        item.variant_title && item.variant_title !== "Default variant"
          ? `<div style="margin-top:2px;font-size:13px;color:${BRAND.muted};">${esc(item.variant_title)}</div>`
          : ""
      return `<tr>
  <td valign="top" style="padding:0 0 12px 0;font-size:15px;color:${BRAND.ink};">
    <div style="font-weight:600;">${esc(item.product_title)}</div>
    ${variant}
    <div style="margin-top:2px;font-size:13px;color:${BRAND.muted};">Qty ${esc(item.quantity)}</div>
  </td>
  <td valign="top" align="right" style="padding:0 0 12px 16px;font-size:15px;color:${BRAND.ink};">${esc(money(item.total, currency))}</td>
</tr>`
    })
    .join("\n")

  const itemsBlock = items.length
    ? `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemRows}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        ${summaryRow("Order total", money(order.total, currency), true)}
      </table>
    </td></tr>`
    : ""

  const noteBlock = `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.muted};">${esc(REFUND_NOTE)} If something looks wrong, reply to this email and we will help.</p>
    </td></tr>`

  const html = renderShell({
    title: `${BRAND.name} order #${order.display_id} cancelled`,
    preheader: `Order #${order.display_id} has been cancelled`,
    heading,
    intro,
    rows: [itemsBlock, noteBlock].join("\n"),
  })

  const text = [
    BRAND.name,
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
    ...(items.length ? ["", `Order total: ${money(order.total, currency)}`] : []),
    "",
    REFUND_NOTE,
    "If something looks wrong, reply to this email and we will help.",
    "",
    FOOTER_TEXT,
  ].join("\n")

  return { html, text }
}
