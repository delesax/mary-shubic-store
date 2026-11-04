"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"
import { getBaseURL } from "@lib/util/env"
import { getBillingDetails } from "@lib/util/stripe-billing"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // A second click, or a re-render mid-payment, must never confirm or place twice
  const inFlight = useRef(false)

  const params = useParams()

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
        inFlight.current = false
      })
  }

  const stripe = useStripe()
  const elements = useElements()

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    if (inFlight.current) {
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setErrorMessage(null)
    setNotice(null)

    if (!stripe || !elements || !cart) {
      setSubmitting(false)
      inFlight.current = false
      return
    }

    // Wallets, Klarna and Revolut Pay may send the customer away and back to the return
    // page, which completes the cart. Cards finish here (redirect "if_required").
    const countryCode = (
      (params?.countryCode as string | undefined) ??
      cart.shipping_address?.country_code ??
      ""
    ).toLowerCase()
    const returnUrl = `${getBaseURL().replace(/\/$/, "")}/${countryCode}/checkout/return?cart_id=${encodeURIComponent(cart.id)}`

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: getBillingDetails(cart),
        },
      },
      redirect: "if_required",
    })

    if (error) {
      const pi = error.payment_intent

      if (pi && (pi.status === "requires_capture" || pi.status === "succeeded")) {
        return onPaymentCompleted()
      }

      setErrorMessage(error.message || "Your payment could not be completed.")
      setSubmitting(false)
      inFlight.current = false
      return
    }

    if (
      paymentIntent?.status === "requires_capture" ||
      paymentIntent?.status === "succeeded"
    ) {
      return onPaymentCompleted()
    }

    if (paymentIntent?.status === "processing") {
      // Not final yet. Stripe's webhook completes the order when the payment settles.
      setNotice(
        "Your payment is processing. We will email your order confirmation as soon as it is complete."
      )
      setSubmitting(false)
      return
    }

    setErrorMessage("Your payment could not be completed. Please try again.")
    setSubmitting(false)
    inFlight.current = false
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
      {notice && (
        <div
          className="pt-2 text-ink/70 text-small-regular"
          data-testid="stripe-payment-notice"
        >
          <span>{notice}</span>
        </div>
      )}
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
