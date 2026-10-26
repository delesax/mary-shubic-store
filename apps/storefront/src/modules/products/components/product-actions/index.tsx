"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const countryCode = useParams().countryCode as string

  // Preselect: one variant -> all options; otherwise the first in-stock colour
  // (size is left for the customer to choose)
  // Runs once per product. Without the ref guard, the v_id URL update below
  // re-renders the page with fresh product objects, this effect re-fires and
  // wipes the size the customer just chose.
  const preselectedFor = useRef<string | null>(null)
  useEffect(() => {
    if (preselectedFor.current === product.id) return
    preselectedFor.current = product.id

    const variants = product.variants ?? []

    if (variants.length === 1) {
      setOptions(optionsAsKeymap(variants[0].options) ?? {})
      return
    }

    const colourOption = product.options?.find((o) =>
      ["colour", "color"].includes((o.title ?? "").toLowerCase())
    )
    if (!colourOption) return

    const hasStock = (v: HttpTypes.StoreProductVariant) =>
      !v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0

    const first = variants.find(hasStock) ?? variants[0]
    const value = first?.options?.find(
      (o) => o.option_id === colourOption.id
    )?.value

    if (value) setOptions({ [colourOption.id]: value })
  }, [product.id, product.variants, product.options])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // the first option the customer still has to choose (e.g. Size)
  const missingOption = useMemo(
    () => (product.options || []).find((o) => !options[o.id]),
    [product.options, options]
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // hide the "added" confirmation after a few seconds
  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 4000)
    return () => clearTimeout(timer)
  }, [added])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      setAdded(true)
      router.refresh() // make sure the nav bag count updates
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      {added && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 top-4 z-[100] flex items-center justify-between gap-4 rounded-[2px] bg-ink px-4 py-3 text-ivory shadow-lg small:left-auto small:right-6 small:w-80"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">
            Added to bag ✓
          </span>
          <LocalizedClientLink
            href="/cart"
            className="text-xs font-semibold uppercase tracking-widest underline"
          >
            View bag
          </LocalizedClientLink>
        </div>
      )}

      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-6">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider className="border-ink/10" />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-14 !bg-wine hover:!bg-wine-deep !text-ivory !text-xs !font-body !font-semibold !uppercase !tracking-widest !rounded-[2px] disabled:!bg-ink/20 disabled:!text-ink/40"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && missingOption
            ? `Select ${missingOption.title}`
            : !inStock || !isValidVariant
            ? "Out of stock"
            : added
            ? "Added ✓"
            : "Add to Bag"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
