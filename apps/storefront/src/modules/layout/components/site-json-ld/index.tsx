// Site-wide structured data (Organization + WebSite), rendered once in the root layout.
// Static, so it renders on every page without any data fetching.
const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"
).replace(/\/$/, "")

// TODO: replace these placeholders with the real details. Any value that still
// starts with "TODO" is left out of the page output, so nothing placeholder
// ever reaches search engines.
const LEGAL_NAME = "TODO_LEGAL_NAME"
const COMPANY_NUMBER = "TODO_COMPANY_NUMBER" // Companies House registration number
const ADDRESS = {
  streetAddress: "TODO_STREET_ADDRESS",
  addressLocality: "TODO_TOWN_OR_CITY",
  postalCode: "TODO_POSTCODE",
  addressCountry: "GB",
}

const filled = (value: string) => !value.startsWith("TODO")

// Search results live under the default store country (the /search route, noindex)
const SEARCH_COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb").toLowerCase()

export default function SiteJsonLd() {
  const addressFilled = Object.entries(ADDRESS).every(
    ([key, value]) => key === "addressCountry" || filled(value)
  )

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Mary Shubic",
    legalName: filled(LEGAL_NAME) ? LEGAL_NAME : undefined,
    url: BASE_URL,
    logo: `${BASE_URL}/logo/mary-shubic-logo5-wine-rose.svg`,
    email: "contact@maryshubic.com",
    identifier: filled(COMPANY_NUMBER)
      ? {
          "@type": "PropertyValue",
          propertyID: "Companies House number",
          value: COMPANY_NUMBER,
        }
      : undefined,
    address: addressFilled
      ? { "@type": "PostalAddress", ...ADDRESS }
      : undefined,
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "Mary Shubic",
    url: BASE_URL,
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/${SEARCH_COUNTRY}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  // "<" is escaped so the text can never close the script tag
  const toJson = (data: unknown) =>
    JSON.stringify(data).replace(/</g, "\\u003c")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJson(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJson(website) }}
      />
    </>
  )
}
