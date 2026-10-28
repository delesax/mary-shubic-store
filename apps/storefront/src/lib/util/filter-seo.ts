const FILTER_KEYS = ["colour", "size", "price", "condition", "sortBy"]

export const hasActiveFilters = (
  searchParams: Record<string, string | undefined>
) => FILTER_KEYS.some((k) => !!searchParams[k])

export const robotsFor = (searchParams: Record<string, string | undefined>) =>
  hasActiveFilters(searchParams)
    ? { index: false, follow: true }
    : undefined
