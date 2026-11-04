// What to do when the customer lands back on /checkout/return after a redirect payment
// (Klarna, Revolut Pay, 3D Secure pages). The PaymentIntent status read from Stripe is
// the source of truth; redirect_status from the URL is only a fallback.
export type ReturnOutcome =
  | "place_order" // paid or authorised: complete the cart (Medusa re-checks with Stripe)
  | "processing" // not final yet: wait, the webhook completes the order
  | "canceled"
  | "failed"

export const getReturnOutcome = (
  paymentIntentStatus?: string | null,
  redirectStatus?: string | null
): ReturnOutcome => {
  switch (paymentIntentStatus) {
    case "succeeded":
    case "requires_capture":
      return "place_order"
    case "processing":
      return "processing"
    case "canceled":
      return "canceled"
    case undefined:
    case null:
      // Could not read the intent: fall back to what Stripe put in the URL
      if (redirectStatus === "succeeded") return "place_order"
      if (redirectStatus === "pending") return "processing"
      return "failed"
    default:
      // requires_payment_method, requires_action, requires_confirmation, ...
      return "failed"
  }
}

export const PROCESSING_POLL_MS = 4000
export const PROCESSING_MAX_POLLS = 30 // about two minutes, then rely on the webhook + email
