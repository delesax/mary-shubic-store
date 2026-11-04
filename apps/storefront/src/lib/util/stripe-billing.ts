import type { HttpTypes } from "@medusajs/types"
import type { StripePaymentElementOptions } from "@stripe/stripe-js"

// Billing details are already collected in the Addresses step, so the Payment Element
// hides name and address and we pass them back explicitly when confirming. Whatever is
// hidden here MUST be passed in getBillingDetails(); both read the same cart data.
const billingAddress = (cart: HttpTypes.StoreCart) =>
  cart.billing_address ?? cart.shipping_address

export const getBillingFields = (
  cart: HttpTypes.StoreCart
): NonNullable<StripePaymentElementOptions["fields"]> => ({
  billingDetails: {
    name: "never",
    address: "never",
    // Link works best with an email field that is prefilled, not hidden
    email: "auto",
    phone: billingAddress(cart)?.phone ? "never" : "auto",
  },
})

export const getBillingDetails = (cart: HttpTypes.StoreCart) => {
  const a = billingAddress(cart)

  return {
    name: `${a?.first_name ?? ""} ${a?.last_name ?? ""}`.trim(),
    email: cart.email ?? undefined,
    phone: a?.phone || undefined,
    address: {
      line1: a?.address_1 ?? "",
      line2: a?.address_2 ?? "",
      city: a?.city ?? "",
      state: a?.province ?? "",
      postal_code: a?.postal_code ?? "",
      country: (a?.country_code ?? "").toUpperCase(),
    },
  }
}
