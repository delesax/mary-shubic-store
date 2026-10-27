import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COLOUR_SWATCH_MODULE } from "../../../modules/colour-swatch"
import ColourSwatchModuleService from "../../../modules/colour-swatch/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: ColourSwatchModuleService =
    req.scope.resolve(COLOUR_SWATCH_MODULE)

  const rows = await service.listColourSwatches({}, { take: null })

  res.json({
    swatches: rows.map((r) => ({
      name: r.name,
      hex: r.hex,
      hex_secondary: r.hex_secondary ?? null,
    })),
  })
}