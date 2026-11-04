"use server"

import { listProducts } from "@lib/data/products"
import {
  normalizeQuery,
  SEARCH_MIN_CHARS,
  SUGGESTION_LIMIT,
} from "@lib/util/search"

export type SearchSuggestion = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

// Live suggestions for the header search box. Runs on the server so the browser never
// needs the Medusa key; any failure returns no suggestions and the form still works.
export async function searchSuggestions(
  rawQuery: string,
  countryCode: string
): Promise<SearchSuggestion[]> {
  const q = normalizeQuery(rawQuery)

  if (q.length < SEARCH_MIN_CHARS || !countryCode) {
    return []
  }

  try {
    const {
      response: { products },
    } = await listProducts({
      countryCode,
      queryParams: { q, limit: SUGGESTION_LIMIT },
    })

    return products
      .filter((p) => !!p.handle)
      .map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle as string,
        thumbnail: p.thumbnail ?? null,
      }))
  } catch {
    return []
  }
}
