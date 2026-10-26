// Product condition labels and the definitions shown on the product page.
// Keep the labels identical to the Conditions sheet in catalogue.xlsx (matching ignores case).
export type ProductCondition = { label: string; definition: string }

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  {
    label: "New with Tags (NWT)",
    definition:
      "Unworn and unused, in its original packaging with all original retail tags attached. No signs of wear.",
  },
  {
    label: "New without Tags (NWOT)",
    definition:
      "Unworn and in perfect condition, but the original retail tags are missing. Original packaging may or may not be included.",
  },
  {
    label: "Like New",
    definition:
      "Looks new. It may have been tried on or gently handled, but shows no visible signs of wear, marks, fading or defects. Fully wearable.",
  },
  {
    label: "Excellent",
    definition:
      "Lightly worn and well cared for. May show very minor signs of wear, such as faint marks or slight softening of the fabric, but no flaws that affect wearing it.",
  },
  {
    label: "Good",
    definition:
      "Clearly worn but fully wearable. May show visible signs of use such as light fading, minor pilling, small marks or slightly loosened stitching. Any flaws are described in the listing.",
  },
  {
    label: "Fair",
    definition:
      "Heavily worn with significant signs of use. May have noticeable flaws such as fading, pilling, stains or small repairs needed, but is still wearable. Flaws are described in the listing.",
  },
]

export const getCondition = (value: unknown): ProductCondition | null => {
  if (typeof value !== "string" || !value.trim()) return null
  const found = PRODUCT_CONDITIONS.find(
    (c) => c.label.toLowerCase() === value.trim().toLowerCase()
  )
  return found ?? { label: value.trim(), definition: "" }
}
