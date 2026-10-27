"use server"

import { sdk } from "@lib/config"
import { SwatchMap } from "@lib/util/colour-swatch"
import { getCacheOptions } from "./cookies"

export const getColourSwatches = async (): Promise<SwatchMap> => {
  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60,
  }

  try {
    const { swatches } = await sdk.client.fetch<{
      swatches: { name: string; hex: string; hex_secondary: string | null }[]
    }>("/store/colour-swatches", {
      method: "GET",
      next,
      cache: "force-cache",
    })

    const map: SwatchMap = {}
    for (const s of swatches) {
      map[s.name.trim().toLowerCase()] = {
        hex: s.hex,
        hex_secondary: s.hex_secondary,
      }
    }
    return map
  } catch {
    return {}
  }
}
