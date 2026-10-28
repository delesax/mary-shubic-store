import { HttpTypes } from "@medusajs/types"

// Structured data so Google can show price, stock and condition in results.
// Server component: render it once inside the product page template.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"

const inStock = (v: HttpTypes.StoreProductVariant) =>
  !v.manage_inventory || !!v.allow_backorder || (v.inventory_quantity ?? 0) > 0

export default function ProductJsonLd({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const url = `${BASE_URL.replace(/\/$/, "")}/${countryCode}/products/${product.handle}`
  const condition = String(product.metadata?.condition ?? "").trim().toLowerCase()
  const itemCondition = condition
    ? condition.startsWith("new ") || condition === "nwt" || condition === "nwot"
      ? "https://schema.org/NewCondition"
      : "https://schema.org/UsedCondition"
    : undefined

  const offers = (product.variants ?? [])
    .map((v) => {
      const price = v.calculated_price?.calculated_amount
      const currency = v.calculated_price?.currency_code
      if (price == null || !currency) return null
      return {
        "@type": "Offer",
        sku: v.sku ?? undefined,
        price: Number(price).toFixed(2),
        priceCurrency: currency.toUpperCase(),
        availability: inStock(v)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition,
        url,
      }
    })
    .filter(Boolean)

  const images = (product.images ?? []).map((i) => i.url).filter(Boolean)

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: images.length ? images : product.thumbnail ? [product.thumbnail] : undefined,
    brand: { "@type": "Brand", name: "Mary Shubic" },
    material: product.material || undefined,
    countryOfOrigin: product.origin_country || undefined,
    url,
    offers: offers.length ? offers : undefined,
  }

  return (
    <script
      type="application/ld+json"
      // "<" is escaped so product text can never close the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
