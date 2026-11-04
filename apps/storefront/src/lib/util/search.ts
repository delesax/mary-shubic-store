// Shared by the header search box, the suggestions action and the results page.
export const SEARCH_MIN_CHARS = 2
export const SEARCH_MAX_CHARS = 100
export const SEARCH_DEBOUNCE_MS = 250
export const SUGGESTION_LIMIT = 5

// Trim, collapse whitespace and cap the length. An empty string means "no query".
export const normalizeQuery = (raw?: string | null): string =>
  (raw ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_CHARS)
