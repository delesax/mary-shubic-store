import { model } from "@medusajs/framework/utils"

const ColourSwatch = model.define("colour_swatch", {
  id: model.id().primaryKey(),
  name: model.text(),
  hex: model.text(),
  hex_secondary: model.text().nullable(),
})

export default ColourSwatch