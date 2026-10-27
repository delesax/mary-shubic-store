export type Swatch = { hex: string; hex_secondary: string | null }
export type SwatchMap = Record<string, Swatch>

const FALLBACK = "#E9DDD9"
const MULTICOLOUR =
  "conic-gradient(#C8102E, #F2C94C, #2E7D4F, #2F6DB5, #7A3B44, #C8102E)"

// Returns a CSS `background` value for a colour name.
export const swatchBackground = (name: string, swatches: SwatchMap): string => {
  const key = name.trim().toLowerCase()
  if (key === "multicolour" || key === "multicolor" || key === "multi") {
    return MULTICOLOUR
  }
  const swatch = swatches[key]
  if (!swatch) return FALLBACK
  if (swatch.hex_secondary) {
    return `linear-gradient(135deg, ${swatch.hex} 50%, ${swatch.hex_secondary} 50%)`
  }
  return swatch.hex
}