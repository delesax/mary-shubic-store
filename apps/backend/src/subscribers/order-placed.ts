import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  try {
    await sendOrderConfirmationWorkflow(container).run({
      input: { id: data.id },
    })
  } catch (e) {
    // Never let an email problem affect the order itself.
    logger.error(
      `Order confirmation email failed for ${data.id}: ${
        e instanceof Error ? e.message : String(e)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}