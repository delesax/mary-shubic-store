import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { PaymentElement } from "@stripe/react-stripe-js"
import { StripePaymentElementOptions } from "@stripe/stripe-js"
import { HttpTypes } from "@medusajs/types"
import { getBillingFields } from "@lib/util/stripe-billing"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex flex-col gap-y-2 font-body text-sm cursor-pointer py-4 border border-ink/15 rounded-md px-8 mb-2 hover:border-wine transition-colors duration-200",
        {
          "border-wine bg-blush/10":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-sm text-ink">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="justify-self-end text-ink">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

// Names shown in the Payment step summary, from the Payment Element's change event
const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  klarna: "Klarna",
  link: "Link",
  revolut_pay: "Revolut Pay",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
}

const getMethodLabel = (type?: string | null) => {
  if (!type) {
    return null
  }

  return (
    METHOD_LABELS[type] ??
    type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  )
}

export const StripePaymentContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  cart,
  setMethodLabel,
  setError,
  setPaymentComplete,
}: Omit<PaymentContainerProps, "children"> & {
  cart: HttpTypes.StoreCart
  setMethodLabel: (label: string | null) => void
  setError: (error: string | null) => void
  setPaymentComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  // Whether the phone field is hidden depends on the cart; the Payment Element cannot
  // change its hidden fields after mounting, so remount it if that ever flips.
  const hasPhone = !!(cart.billing_address ?? cart.shipping_address)?.phone

  const options: StripePaymentElementOptions = useMemo(() => {
    return {
      layout: {
        type: "accordion",
        defaultCollapsed: false,
        radios: true,
        spacedAccordionItems: true,
      },
      fields: getBillingFields(cart),
      defaultValues: {
        billingDetails: { email: cart.email ?? undefined },
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPhone])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="text-sm font-medium text-ink mb-2">
              Choose how you would like to pay:
            </Text>
            <PaymentElement
              key={hasPhone ? "with-phone" : "no-phone"}
              options={options}
              onChange={(e) => {
                setMethodLabel(getMethodLabel(e.value?.type))
                setPaymentComplete(e.complete)
                setError(null)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
