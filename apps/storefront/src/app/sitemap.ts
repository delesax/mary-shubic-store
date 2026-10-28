import { MetadataRoute } from "next"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listAllProducts } from "@lib/data/products"

// Built at request time so the build never depends on the backend being up.
export const dynamic = "force-dynamic"

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"
).replace(/\/$/, "")
const COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb").toLowerCase()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now },
    { url: `${BASE}/${COUNTRY}/store`, lastModified: now },
    { url: `${BASE}/${COUNTRY}/size-guide`, lastModified: now },
  ]

  try {
    const categories = ((await listCategories()) ?? []) as {
      handle?: string | null
    }[]
    for (const c of categories) {
      if (c.handle) {
        entries.push({
          url: `${BASE}/${COUNTRY}/categories/${c.handle}`,
          lastModified: now,
        })
      }
    }
  } catch {}

  try {
    const { collections } = await listCollections({ fields: "handle" })
    for (const c of collections ?? []) {
      if (c.handle) {
        entries.push({
          url: `${BASE}/${COUNTRY}/collections/${c.handle}`,
          lastModified: now,
        })
      }
    }
  } catch {}

  try {
    const products = await listAllProducts({
      countryCode: COUNTRY,
      queryParams: { fields: "handle,updated_at" },
    })
    for (const p of products) {
      if (p.handle) {
        entries.push({
          url: `${BASE}/${COUNTRY}/products/${p.handle}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
        })
      }
    }
  } catch {}

  return entries
}
