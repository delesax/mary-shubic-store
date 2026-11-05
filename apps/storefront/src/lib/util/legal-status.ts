import type { Metadata, MetadataRoute } from "next"
import {
  COMPANY,
  LEGAL_PAGES,
  LEGAL_PAGES_DRAFT,
  LEGAL_SLUGS,
  type LegalSlug,
} from "../../content/legal/pages"
import { countPlaceholders } from "./legal-markdown"

export type LegalStatus = {
  perPage: Record<LegalSlug, number>
  total: number
  // true while the switch is on OR any placeholder remains: banner + noindex + no sitemap
  draft: boolean
}

export const getLegalStatus = (): LegalStatus => {
  const perPage = Object.fromEntries(
    LEGAL_SLUGS.map((slug) => [slug, countPlaceholders(LEGAL_PAGES[slug].body, COMPANY)])
  ) as Record<LegalSlug, number>
  const total = Object.values(perPage).reduce((sum, n) => sum + n, 0)

  return { perPage, total, draft: LEGAL_PAGES_DRAFT || total > 0 }
}

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"
).replace(/\/$/, "")
const COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb").toLowerCase()

// Static metadata for a legal page: title, description, canonical on the public site, and
// noindex while the pages are drafts.
export const legalMetadata = (slug: LegalSlug): Metadata => {
  const page = LEGAL_PAGES[slug]
  const { draft } = getLegalStatus()

  return {
    title: `${page.title} | Mary Shubic`,
    description: page.description,
    alternates: { canonical: `${BASE}/${COUNTRY}/${page.slug}` },
    robots: draft ? { index: false, follow: false } : { index: true, follow: true },
  }
}

// Sitemap entries for the legal pages. Empty while they are drafts: a sitemap must not list
// pages that are marked noindex.
export const legalSitemapEntries = (
  now: Date = new Date()
): MetadataRoute.Sitemap =>
  getLegalStatus().draft
    ? []
    : LEGAL_SLUGS.map((slug) => ({
        url: `${BASE}/${COUNTRY}/${LEGAL_PAGES[slug].slug}`,
        lastModified: now,
      }))
