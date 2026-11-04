import { Metadata } from "next"

import { normalizeQuery } from "@lib/util/search"
import SearchTemplate from "@modules/search/templates"

// Search results are not for search engines to index
export const metadata: Metadata = {
  title: "Search | Mary Shubic",
  robots: {
    index: false,
    follow: true,
  },
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[]; page?: string }>
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const { q, page } = await props.searchParams

  // ?q=a&q=b arrives as an array: use the first value
  const query = normalizeQuery(Array.isArray(q) ? q[0] : q)

  return <SearchTemplate query={query} page={page} countryCode={countryCode} />
}
