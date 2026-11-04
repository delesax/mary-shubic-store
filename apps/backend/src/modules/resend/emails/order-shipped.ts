// "Your order has shipped" email, with tracking when the carrier label has it.
import {
  addressLines,
  BRAND,
  esc,
  FOOTER_TEXT,
  renderButton,
  renderShell,
  safeUrl,
  type Address,
  type OrderItem,
  type RenderedEmail,
} from "./shared"

type ShipmentItem = {
  title?: string | null
  quantity?: number | null
  line_item_id?: string | null
}

type ShipmentLabel = {
  tracking_number?: string | null
  tracking_url?: string | null
}

export type OrderShippedEmailProps = {
  order: {
    id: string
    display_id: number
    items?: OrderItem[]
    shipping_address?: Address | null
  }
  // The fulfillment (shipment) that was just sent; its items and labels may be empty
  fulfillment?: {
    items?: ShipmentItem[]
    labels?: ShipmentLabel[]
  } | null
}

export function renderOrderShippedEmail({
  order,
  fulfillment,
}: OrderShippedEmailProps): RenderedEmail {
  const firstName = order.shipping_address?.first_name?.trim()
  const lines = addressLines(order.shipping_address)
  const heading = firstName ? `On its way, ${firstName}` : "Your order is on its way"
  const intro = `Order #${order.display_id} has shipped.`

  // Tracking: one block per label that has a number or a link
  const labels = (fulfillment?.labels ?? [])
    .map((l) => ({
      number: l.tracking_number?.trim() || "",
      url: safeUrl(l.tracking_url),
    }))
    .filter((l) => l.number || l.url)

  const trackingBlock = labels.length
    ? labels
        .map(
          (l) => `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <div style="font-size:13px;font-weight:600;color:${BRAND.ink};margin:0 0 6px;">Tracking</div>
      ${l.number ? `<div style="font-size:15px;color:${BRAND.ink};margin:0 0 12px;">${esc(l.number)}</div>` : ""}
      ${l.url ? renderButton(l.url, "Track your parcel") : ""}
    </td></tr>`
        )
        .join("\n")
    : `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <p style="margin:0;font-size:14px;color:${BRAND.muted};">No tracking details were provided for this shipment. If you have any questions, just reply to this email.</p>
    </td></tr>`

  // Items in this shipment (fall back to the whole order when the shipment lists none)
  const byId = new Map((order.items ?? []).map((i) => [i.id, i]))
  const shipped = (fulfillment?.items ?? []).map((s) => {
    const match = s.line_item_id ? byId.get(s.line_item_id) : undefined
    return {
      title: match?.product_title || s.title || "Item",
      variant:
        match?.variant_title && match.variant_title !== "Default variant"
          ? match.variant_title
          : "",
      quantity: Number(s.quantity ?? match?.quantity ?? 1),
    }
  })
  const listed = shipped.length
    ? shipped
    : (order.items ?? []).map((i) => ({
        title: i.product_title || "Item",
        variant: i.variant_title && i.variant_title !== "Default variant" ? i.variant_title : "",
        quantity: Number(i.quantity ?? 1),
      }))

  const itemRows = listed
    .map(
      (i) => `<tr>
  <td valign="top" style="padding:0 0 12px 0;font-size:15px;color:${BRAND.ink};">
    <div style="font-weight:600;">${esc(i.title)}</div>
    ${i.variant ? `<div style="margin-top:2px;font-size:13px;color:${BRAND.muted};">${esc(i.variant)}</div>` : ""}
  </td>
  <td valign="top" align="right" style="padding:0 0 12px 16px;font-size:14px;color:${BRAND.muted};">Qty ${esc(i.quantity)}</td>
</tr>`
    )
    .join("\n")

  const itemsBlock = listed.length
    ? `<tr><td style="border-top:1px solid ${BRAND.rule};padding-top:24px;">
      <div style="font-size:13px;font-weight:600;color:${BRAND.ink};margin:0 0 12px;">In this delivery</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemRows}
      </table>
    </td></tr>`
    : ""

  const addressBlock = lines.length
    ? `<tr><td style="padding-top:12px;">
  <div style="font-size:13px;font-weight:600;color:${BRAND.ink};margin:12px 0 6px;">Shipping to</div>
  <div style="font-size:13px;line-height:20px;color:${BRAND.muted};">${lines.map(esc).join("<br>")}</div>
</td></tr>`
    : ""

  const html = renderShell({
    title: `${BRAND.name} order #${order.display_id} has shipped`,
    preheader: `Order #${order.display_id} is on its way`,
    heading,
    intro,
    rows: [trackingBlock, itemsBlock, addressBlock].join("\n"),
  })

  const text = [
    BRAND.name,
    "",
    heading,
    intro,
    "",
    ...(labels.length
      ? labels.flatMap((l) => [
          "Tracking:",
          ...(l.number ? [l.number] : []),
          ...(l.url ? [l.url] : []),
        ])
      : ["No tracking details were provided for this shipment."]),
    ...(listed.length
      ? [
          "",
          "In this delivery:",
          ...listed.map((i) => `${i.title}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}`),
        ]
      : []),
    ...(lines.length ? ["", "Shipping to:", ...lines] : []),
    "",
    FOOTER_TEXT,
  ].join("\n")

  return { html, text }
}
