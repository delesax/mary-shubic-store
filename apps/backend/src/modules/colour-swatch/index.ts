import ColourSwatchModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const COLOUR_SWATCH_MODULE = "colourSwatch"

export default Module(COLOUR_SWATCH_MODULE, {
  service: ColourSwatchModuleService,
})
