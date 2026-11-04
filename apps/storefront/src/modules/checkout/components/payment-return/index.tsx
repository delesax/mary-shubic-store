"use client"

import { placeOrder } from "@lib/data/cart"
import { stripePromise } from "@lib/stripe-client"
import {
  getReturnOutcome,
  PROCESSING_MAX_POLLS,
  PROCESSING_POLL_MS,
} from "@lib/util/payment-return"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type View =
  | { kind: "checking" }
  | { kind: "processing" }
  | { kind: "failed"; message: string }
  | { kind: "order_error"; message: string }
  | { kind: "invalid" }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Where the customer lands after a redirect payment (Klarna, Revolut Pay, 3D Secure pages).
// It reads the PaymentIntent status from Stripe, then completes the cart exactly once.
// Medusa re-checks the payment with Stripe when completing the cart, and its webhook can
// complete the same cart on its own, so a closed tab or a refresh never double-orders.
const PaymentReturn = () => {
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>({ kind: "checking" })
  const started = useRef(false)
  const placing = useRef(false)
  const mounted = useRef(false)

  const secret = searchParams.get("payment_intent_client_secret")
  const redirectStatus = searchParams.get("redirect_status")
  const cartId = searchParams.get("cart_id") ?? undefined

  const show = (next: View) => {
    if (mounted.current) {
      setView(next)
    }
  }

  const complete = async () => {
    if (placing.current) {
      return
    }
    placing.current = true

    try {
      // On success this redirects to the order confirmation page. If the cart is already
      // completed (refresh), Medusa returns the existing order and we land there again.
      await placeOrder(cartId)
      // Reaching here means the cart was not completed (no order came back)
      placing.current = false
      show({
        kind: "order_error",
        message:
          "We could not finish your order automatically yet. If your payment was taken, your confirmation email will follow shortly.",
      })
    } catch (err) {
      placing.current = false
      show({
        kind: "order_error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "We could not finish your order automatically. If your payment was taken, your confirmation email will follow shortly.",
      })
    }
  }

  const run = async () => {
    if (!secret) {
      show({ kind: "invalid" })
      return
    }

    const stripe = await stripePromise
    let polls = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let status: string | undefined

      if (stripe) {
        const { paymentIntent } = await stripe.retrievePaymentIntent(secret)
        status = paymentIntent?.status
      }

      const outcome = getReturnOutcome(status, redirectStatus)

      if (outcome === "place_order") {
        await complete()
        return
      }

      if (outcome === "processing") {
        show({ kind: "processing" })
        polls += 1
        if (polls > PROCESSING_MAX_POLLS || !mounted.current) {
          return
        }
        await sleep(PROCESSING_POLL_MS)
        continue
      }

      show({
        kind: "failed",
        message:
          outcome === "canceled"
            ? "This payment was cancelled, so no money has been taken."
            : "Your payment did not go through, so no money has been taken.",
      })
      return
    }
  }

  useEffect(() => {
    mounted.current = true
    if (!started.current) {
      started.current = true
      void run()
    }
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="content-container px-4 md:px-6 small:px-8 py-12">
      <div
        className="bg-ivory panel-pad max-w-xl mx-auto flex flex-col gap-y-4"
        data-testid="payment-return"
      >
        {view.kind === "checking" && (
          <>
            <Heading level="h1" className="text-2xl">
              Confirming your payment
            </Heading>
            <p className="text-sm text-ink/70">
              Please wait a moment. Do not close or refresh this page.
            </p>
          </>
        )}

        {view.kind === "processing" && (
          <>
            <Heading level="h1" className="text-2xl">
              Your payment is processing
            </Heading>
            <p className="text-sm text-ink/70">
              This can take a little while. You can close this page: we will
              email your order confirmation as soon as the payment is complete.
            </p>
          </>
        )}

        {view.kind === "failed" && (
          <>
            <Heading level="h1" className="text-2xl">
              Payment not completed
            </Heading>
            <p className="text-sm text-ink/70" data-testid="payment-return-message">
              {view.message}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest">
              <LocalizedClientLink
                href="/checkout?step=payment"
                className="text-wine hover:text-wine/70"
              >
                Back to payment
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/cart"
                className="text-wine hover:text-wine/70"
              >
                Back to your bag
              </LocalizedClientLink>
            </div>
          </>
        )}

        {view.kind === "order_error" && (
          <>
            <Heading level="h1" className="text-2xl">
              We are finishing your order
            </Heading>
            <p className="text-sm text-ink/70" data-testid="payment-return-message">
              {view.message}
            </p>
            <LocalizedClientLink
              href="/cart"
              className="text-wine hover:text-wine/70 text-xs uppercase tracking-widest"
            >
              Back to your bag
            </LocalizedClientLink>
          </>
        )}

        {view.kind === "invalid" && (
          <>
            <Heading level="h1" className="text-2xl">
              Nothing to confirm
            </Heading>
            <p className="text-sm text-ink/70">
              We could not find a payment to confirm on this page.
            </p>
            <LocalizedClientLink
              href="/cart"
              className="text-wine hover:text-wine/70 text-xs uppercase tracking-widest"
            >
              Back to your bag
            </LocalizedClientLink>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentReturn
