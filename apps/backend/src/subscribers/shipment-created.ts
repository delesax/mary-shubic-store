import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { handleShipmentCreated } from "../lib/notifications/handlers"

// Emails the customer when a shipment is created (unless the admin chose not to notify).
export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  await handleShipmentCreated(container, data)
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
