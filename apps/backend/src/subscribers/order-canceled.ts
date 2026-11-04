import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { handleOrderCanceled } from "../lib/notifications/handlers"

// Emails the customer when an order is cancelled.
export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await handleOrderCanceled(container, data)
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
