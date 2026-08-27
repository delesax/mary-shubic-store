import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ColourSwatchModule from "../modules/colour-swatch"

export default defineLink(
  ColourSwatchModule.linkable.colourSwatch,
  ProductModule.linkable.productOptionValue
)