// Edit the text here to match your Conditions sheet.
const DEFINITIONS: Record<string, string> = {
  "new with tags":
    "Unworn and unused, in its original packaging with all original retail tags attached. No signs of wear.",
  "new without tags":
    "Unworn and in perfect condition, but the original retail tags are missing. Original packaging may or may not be included.",
  "like new":
    "Looks new. It may have been tried on or gently handled, but shows no visible signs of wear, marks, fading or defects. Fully wearable.",
  excellent:
    "Lightly worn and well cared for. May show very minor signs of wear, such as faint marks or slight softening of the fabric, but no flaws that affect wearing it.",
  good:
    "Clearly worn but fully wearable. May show visible signs of use such as light fading, minor pilling, small marks or slightly loosened stitching. Any flaws are described in the listing.",
  fair:
    "Heavily worn with significant signs of use. May have noticeable flaws such as fading, pilling, stains or small repairs needed, but is still wearable. Flaws are described in the listing.",
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
