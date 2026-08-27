import { MedusaService } from "@medusajs/framework/utils"
import ColourSwatch from "./models/colour-swatch"

class ColourSwatchModuleService extends MedusaService({
  ColourSwatch,
}) {}

export default ColourSwatchModuleService