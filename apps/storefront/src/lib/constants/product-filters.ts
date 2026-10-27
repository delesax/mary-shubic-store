export const PRICE_BANDS = [
  { key: "under-25", label: "Under £25", min: 0, max: 25 },
  { key: "25-50", label: "£25 – £50", min: 25, max: 50 },
  { key: "50-100", label: "£50 – £100", min: 50, max: 100 },
  { key: "100-plus", label: "£100+", min: 100, max: Infinity },
]

export type ProductFilters = {
  colours: string[]
  sizes: string[]
  prices: string[]
  conditions: string[]
}

export const parseList = (value?: string | string[]) => {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(",") : value
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export const parseFilters = (sp: {
  colour?: string | string[]
  size?: string | string[]
  price?: string | string[]
  condition?: string | string[]
}): ProductFilters => ({
  colours: parseList(sp.colour),
  sizes: parseList(sp.size),
  prices: parseList(sp.price),
  conditions: parseList(sp.condition),
})