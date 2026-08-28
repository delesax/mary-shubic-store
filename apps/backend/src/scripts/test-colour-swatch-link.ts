import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { COLOUR_SWATCH_MODULE } from "../modules/colour-swatch"

export default async function testColourSwatchLink({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const colourSwatchModuleService = container.resolve(COLOUR_SWATCH_MODULE)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  // 1. Create a throwaway test product with a Colour option
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

  logger.info(`Created test product: ${product.id}`)

  // 2. Fetch the option value that was just generated
  const [productWithOptions] = await productModuleService.listProducts(
    { id: [product.id] },
    { relations: ["options", "options.values"] }
  )

  const optionValue = productWithOptions.options[0].values[0]
  logger.info(`Product option value id: ${optionValue.id}`)

  // 3. Create a ColourSwatch record
  const swatch = await colourSwatchModuleService.createColourSwatches({
    name: "Wine Rose",
    hex: "#7A3B44",
  })

  logger.info(`Created colour swatch: ${swatch.id}`)

  // 4. Link the swatch to the option value
  await remoteLink.create({
    [COLOUR_SWATCH_MODULE]: {
      colour_swatch_id: swatch.id,
    },
    [Modules.PRODUCT]: {
      product_option_value_id: optionValue.id,
    },
  })

  logger.info("Link created successfully")
  logger.info(`TEST_PRODUCT_ID=${product.id}`)
  logger.info(`TEST_OPTION_VALUE_ID=${optionValue.id}`)
  logger.info(`TEST_SWATCH_ID=${swatch.id}`)
}