// Edit the text here to match your Conditions sheet.
const DEFINITIONS: Record<string, string> = {
  "new with tags": "Brand new, unworn, with the original tags attached.",
  "new without tags": "Brand new and unworn, but the tags have been removed.",
  "like new": "Worn once or twice at most. No visible signs of wear.",
  excellent: "Lightly worn with no noticeable flaws.",
  good: "Worn with minor signs of wear, which are noted in the description.",
  fair: "Visible wear or small flaws, which are noted in the description.",
}

const ALIASES: Record<string, string> = {
  nwt: "new with tags",
  nwot: "new without tags",
}

const normalise = (value: string) => {
  const base = value.replace(/\(.*?\)/g, "").trim().toLowerCase()
  return ALIASES[base] ?? base
}

export const conditionOf = (product: {
  metadata?: Record<string, unknown> | null
}): string | null => {
  const value = product.metadata?.condition
  return typeof value === "string" && value.trim() ? value.trim() : null
}

// "New with Tags (NWT)" -> "NWT"; "Like New" -> "Like New"
export const shortCondition = (value: string) => {
  const match = value.match(/\(([^)]+)\)/)
  return match ? match[1] : value
}

export const conditionDefinition = (value: string): string | null =>
  DEFINITIONS[normalise(value)] ?? null
