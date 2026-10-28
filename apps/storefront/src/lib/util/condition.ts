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
