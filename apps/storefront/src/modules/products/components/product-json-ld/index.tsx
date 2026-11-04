import { HttpTypes } from "@medusajs/types"
import { variantInStock } from "@lib/util/stock"

// Structured data so Google can show price, stock and condition in results.
// Server component: render it once inside the product page template.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"

// "<" is escaped so product text can never close the script tag
const toJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")

export default function ProductJsonLd({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const base = BASE_URL.replace(/\/$/, "")
  const url = `${base}/${countryCode}/products/${product.handle}`
  const condition = String(product.metadata?.condition ?? "").trim().toLowerCase()
  // Items are new unless the product metadata says otherwise
  const isNew =
    !condition ||
    condition === "new" ||
    condition.startsWith("new ") ||
    condition === "nwt" ||
    condition === "nwot"
  const itemCondition = isNew
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition"

  const variants = product.variants ?? []

  const offers = variants
    .map((v) => {
      const price = v.calculated_price?.calculated_amount
      const currency = v.calculated_price?.currency_code
      if (price == null || !currency) return null
      return {
        "@type": "Offer",
        sku: v.sku ?? undefined,
        price: Number(price).toFixed(2),
        priceCurrency: currency.toUpperCase(),
        availability: variantInStock(v)
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
    // Product-level sku only when unambiguous; multi-variant products carry it per offer
    sku: variants.length === 1 ? variants[0].sku ?? undefined : undefined,
    brand: { "@type": "Brand", name: "Mary Shubic" },
    material: product.material || undefined,
    countryOfOrigin: product.origin_country || undefined,
    url,
    offers: offers.length ? offers : undefined,
  }

  const crumbs = [
    { name: "Home", url: `${base}/${countryCode}` },
    { name: "Shop", url: `${base}/${countryCode}/store` },
    ...(product.collection
      ? [
          {
            name: product.collection.title,
            url: `${base}/${countryCode}/collections/${product.collection.handle}`,
          },
        ]
      : []),
    { name: product.title, url },
  ]

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJson(data) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJson(breadcrumbs) }}
      />
    </>
  )
}
