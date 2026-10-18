import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = {
  id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
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
      ],
      filters: { id },
      options: { throwIfKeyNotFound: true },
    })

    const notification = when({ orders }, (data) => !!data.orders[0].email).then(
      () => {
        return sendNotificationStep([
          {
            to: orders[0].email!,
            channel: "email",
            template: "order-placed",
            data: { order: orders[0] },
          },
        ])
      }
    )

    return new WorkflowResponse({ notification })
  }
)