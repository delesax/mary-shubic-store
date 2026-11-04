import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  buildPasswordResetUrl,
  getStorefrontUrl,
  RESET_TOKEN_MINUTES,
} from "./storefront-url"

// What happened, for logs and tests. A handler never throws: an email problem must
// never affect a shipment, a cancellation or a password reset.
export type NotifyOutcome = "sent" | `skipped: ${string}` | `failed: ${string}`

// Template names registered in modules/resend/service.ts (Templates enum)
const TEMPLATE_ORDER_SHIPPED = "order-shipped"
const TEMPLATE_ORDER_CANCELED = "order-canceled"
const TEMPLATE_PASSWORD_RESET = "password-reset"

const ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "total",
  "item_total",
  "tax_total",
  "items.*",
  "shipping_address.*",
  "shipping_methods.*",
]

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function sendEmail(
  container: MedusaContainer,
  notification: { to: string; template: string; data: Record<string, unknown> }
) {
  const notifications = container.resolve(Modules.NOTIFICATION)
  await notifications.createNotifications({ channel: "email", ...notification })
}

// shipment.created: { id: <fulfillment id>, no_notification?: boolean }
export async function handleShipmentCreated(
  container: MedusaContainer,
  data: { id: string; no_notification?: boolean }
): Promise<NotifyOutcome> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    if (data.no_notification) {
      return "skipped: no_notification"
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // The event carries the fulfillment id; the link table gives the order
    const { data: links } = await query.graph({
      entity: "order_fulfillment",
      fields: ["order_id", "fulfillment_id"],
      filters: { fulfillment_id: data.id },
    })
    const orderId = (links as any[])?.[0]?.order_id
    if (!orderId) {
      return "skipped: shipment is not linked to an order"
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        ...ORDER_FIELDS,
        "fulfillments.id",
        "fulfillments.items.*",
        "fulfillments.labels.*",
      ],
      filters: { id: orderId },
    })
    const order = (orders as any[])?.[0]
    if (!order?.email) {
      return "skipped: order has no email"
    }

    const fulfillment =
      (order.fulfillments as any[] | undefined)?.find((f) => f?.id === data.id) ?? null

    await sendEmail(container, {
      to: order.email,
      template: TEMPLATE_ORDER_SHIPPED,
      data: { order, fulfillment },
    })
    return "sent"
  } catch (e) {
    logger.error(`Shipment email failed for ${data?.id}: ${message(e)}`)
    return `failed: ${message(e)}`
  }
}

// order.canceled: { id: <order id> }
export async function handleOrderCanceled(
  container: MedusaContainer,
  data: { id: string }
): Promise<NotifyOutcome> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ORDER_FIELDS,
      filters: { id: data.id },
    })
    const order = (orders as any[])?.[0]
    if (!order?.email) {
      return "skipped: order has no email"
    }

    await sendEmail(container, {
      to: order.email,
      template: TEMPLATE_ORDER_CANCELED,
      data: { order },
    })
    return "sent"
  } catch (e) {
    logger.error(`Cancellation email failed for ${data?.id}: ${message(e)}`)
    return `failed: ${message(e)}`
  }
}

// auth.password_reset: { entity_id: <email>, actor_type, token }
// Only customer resets get an email here (admin users reset through the admin dashboard).
// The token and the link are never logged.
export async function handlePasswordReset(
  container: MedusaContainer,
  data: { entity_id?: string; actor_type?: string; token?: string },
  env: Record<string, string | undefined> = process.env
): Promise<NotifyOutcome> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    if (data.actor_type !== "customer") {
      return "skipped: not a customer reset"
    }
    if (!data.entity_id || !data.token) {
      return "skipped: missing email or token"
    }

    // Best effort: greet the customer by first name
    let firstName: string | null = null
    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["first_name"],
        filters: { email: data.entity_id },
      })
      firstName = (customers as any[])?.[0]?.first_name ?? null
    } catch {
      firstName = null
    }

    const resetUrl = buildPasswordResetUrl({
      baseUrl: getStorefrontUrl(env),
      token: data.token,
      email: data.entity_id,
    })

    await sendEmail(container, {
      to: data.entity_id,
      template: TEMPLATE_PASSWORD_RESET,
      data: { resetUrl, expiresInMinutes: RESET_TOKEN_MINUTES, firstName },
    })
    return "sent"
  } catch (e) {
    logger.error(`Password reset email failed: ${message(e)}`)
    return `failed: ${message(e)}`
  }
}
