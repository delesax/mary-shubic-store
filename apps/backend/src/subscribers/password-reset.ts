import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { handlePasswordReset } from "../lib/notifications/handlers"

// Emails a customer their password reset link.
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  await handlePasswordReset(container, data)
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
