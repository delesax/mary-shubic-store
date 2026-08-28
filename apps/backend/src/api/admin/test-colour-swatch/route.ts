import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { COLOUR_SWATCH_MODULE } from "../../../modules/colour-swatch"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const colourSwatchModuleService = req.scope.resolve(COLOUR_SWATCH_MODULE)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const product = await productModuleService.createProducts({
    title: "Colour Swatch Test Product",
    status: "draft",
    options: [
      {
        title: "Colour",
        values: ["Wine Rose Test"],
      },
    ],
  })

  const [productWithOptions] = await productModuleService.listProducts(
    { id: [product.id] },
    { relations: ["options", "options.values"] }
  )

  const optionValue = productWithOptions.options[0].values[0]

  const swatch = await colourSwatchModuleService.createColourSwatches({
    name: "Wine Rose",
    hex: "#7A3B44",
  })

  await remoteLink.create({
    [COLOUR_SWATCH_MODULE]: {
      colour_swatch_id: swatch.id,
    },
    [Modules.PRODUCT]: {
      product_option_value_id: optionValue.id,
    },
  })

  res.json({
    product_id: product.id,
    option_value_id: optionValue.id,
    swatch_id: swatch.id,
  })
}