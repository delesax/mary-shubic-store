import PaymentReturn from "@modules/checkout/components/payment-return"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturn />
    </Suspense>
  )
}
