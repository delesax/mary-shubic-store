import company from "./company.json"
import contact from "./contact"
import cookies from "./cookies"
import delivery from "./delivery"
import privacy from "./privacy"
import returns from "./returns"
import terms from "./terms"

// ---------------------------------------------------------------------------------------
// DRAFT SWITCH. While this is true every legal page shows a DRAFT banner, is marked
// noindex and is left out of the sitemap. It is also forced on whenever any
// [placeholder] is still left in a page, so an unfinished page is never indexed.
// To go live: fill in the placeholders (company-level ones in company.json, the rest in the
// page files), run `npm run check:legal:strict`, then set this to false.
// ---------------------------------------------------------------------------------------
export const LEGAL_PAGES_DRAFT = true

// Company details shared by every page (empty value = still a placeholder)
export const COMPANY: Record<string, string> = Object.fromEntries(
  Object.entries(company).filter(([key]) => !key.startsWith("_"))
) as Record<string, string>

export type LegalSlug =
  | "terms"
  | "shipping"
  | "returns"
  | "privacy-policy"
  | "cookie-policy"
  | "contact"

export type LegalPage = {
  slug: LegalSlug // also the URL: /<country>/<slug>
  title: string
  description: string
  body: string
  toc: boolean // show a table of contents
  mailto: boolean // turn [CONTACT EMAIL] into a mailto link
}

export const LEGAL_PAGES: Record<LegalSlug, LegalPage> = {
  terms: {
    slug: "terms",
    title: "Terms and Conditions of Sale",
    description: "The terms that apply when you order from Mary Shubic.",
    body: terms,
    toc: true,
    mailto: false,
  },
  shipping: {
    slug: "shipping",
    title: "Delivery Policy",
    description:
      "How we deliver your order: options, prices, times and what to do if something goes wrong.",
    body: delivery,
    toc: false,
    mailto: false,
  },
  returns: {
    slug: "returns",
    title: "Returns and Refunds Policy",
    description:
      "How to return an item, how refunds work and your right to change your mind.",
    body: returns,
    toc: false,
    mailto: false,
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "How Mary Shubic collects, uses and protects your personal information.",
    body: privacy,
    toc: true,
    mailto: false,
  },
  "cookie-policy": {
    slug: "cookie-policy",
    title: "Cookie Policy",
    description:
      "The cookies and similar technologies Mary Shubic uses and how to manage them.",
    body: cookies,
    toc: false,
    mailto: false,
  },
  contact: {
    slug: "contact",
    title: "Contact Us",
    description: "How to contact Mary Shubic customer service.",
    body: contact,
    toc: false,
    mailto: true,
  },
}

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES) as LegalSlug[]
