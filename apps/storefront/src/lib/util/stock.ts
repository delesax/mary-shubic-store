import { HttpTypes } from "@medusajs/types"

const available = (v: HttpTypes.StoreProductVariant): number => {
  if (!v.manage_inventory || v.allow_backorder) return Infinity
  // No stock figure fetched for this variant: unknown, so never claim sold out
  if (typeof v.inventory_quantity !== "number") return Infinity
  return Math.max(v.inventory_quantity, 0)
}

// Total units available across all variants (Infinity if stock isn't tracked or unknown).
export const stockLeft = (product: HttpTypes.StoreProduct): number => {
  const variants = product.variants ?? []
  if (!variants.length) return Infinity
  return variants.reduce((sum, v) => sum + available(v), 0)
}

export const isSoldOut = (product: HttpTypes.StoreProduct) =>
  stockLeft(product) === 0

export const isLastOne = (product: HttpTypes.StoreProduct) =>
  stockLeft(product) === 1
