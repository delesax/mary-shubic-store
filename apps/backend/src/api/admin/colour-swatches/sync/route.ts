import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COLOUR_SWATCH_MODULE } from "../../../../modules/colour-swatch"
import ColourSwatchModuleService from "../../../../modules/colour-swatch/service"

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

type IncomingColour = {
  name?: string
  hex?: string | null
  hex_secondary?: string | null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as { colours?: IncomingColour[] }
  const incoming = Array.isArray(body.colours) ? body.colours : []

  const service: ColourSwatchModuleService =
    req.scope.resolve(COLOUR_SWATCH_MODULE)

  const existing = await service.listColourSwatches({}, { take: null })
  const byName: Record<string, (typeof existing)[number]> = {}
  for (const s of existing) {
    byName[s.name.toLowerCase()] = s
  }

  const toCreate: { name: string; hex: string; hex_secondary: string | null }[] = []
  const toUpdate: { id: string; hex: string; hex_secondary: string | null }[] = []
  const skipped: { name: string; reason: string }[] = []
  const seen: Record<string, boolean> = {}
  let unchanged = 0

  for (const item of incoming) {
    const name = (item.name || "").trim()
    const hex = (item.hex || "").trim().toUpperCase()
    const secondaryRaw = (item.hex_secondary || "").trim().toUpperCase()

    if (!name) {
      skipped.push({ name: "(blank)", reason: "missing name" })
      continue
    }
    if (!HEX_RE.test(hex)) {
      skipped.push({ name, reason: "hex must look like #7A3B44" })
      continue
    }
    if (secondaryRaw && !HEX_RE.test(secondaryRaw)) {
      skipped.push({ name, reason: "hex_secondary must look like #7A3B44" })
      continue
    }

    const key = name.toLowerCase()
    if (seen[key]) {
      skipped.push({ name, reason: "duplicate name in request" })
      continue
    }
    seen[key] = true

    const secondary = secondaryRaw || null
    const current = byName[key]

    if (!current) {
      toCreate.push({ name, hex, hex_secondary: secondary })
      continue
    }

    const currentHex = (current.hex || "").toUpperCase()
    const currentSecondary = current.hex_secondary
      ? current.hex_secondary.toUpperCase()
      : null

    if (currentHex === hex && currentSecondary === secondary) {
      unchanged++
      continue
    }

    toUpdate.push({ id: current.id, hex, hex_secondary: secondary })
  }

  if (toCreate.length) {
    await service.createColourSwatches(toCreate)
  }
  if (toUpdate.length) {
    await service.updateColourSwatches(toUpdate)
  }

  res.json({
    created: toCreate.length,
    updated: toUpdate.length,
    unchanged,
    skipped,
  })
}