import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { getColourSwatches } from "@lib/data/colour-swatches"
import { swatchBackground } from "@lib/util/colour-swatch"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

const MAX_DOTS = 5

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const colourOption = (product.options || []).find((o) =>
    ["colour", "color"].includes((o.title || "").toLowerCase())
  )
  const colours = Array.from(
    new Set((colourOption?.values || []).map((v) => v.value))
  )
  const showDots = colours.length > 1
  const swatches = showDots ? await getColourSwatches() : {}
  const shown = colours.slice(0, MAX_DOTS)
  const extra = colours.length - shown.length

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group"
    >
      <div data-testid="product-wrapper">
        <div className="overflow-hidden rounded-soft">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
        </div>
        <div className="flex flex-col mt-3.5 gap-1">
          <Text
            className="font-body text-sm font-medium text-ink group-hover:text-wine transition-colors duration-200"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && (
              <span className="font-body text-sm font-semibold text-wine">
                <PreviewPrice price={cheapestPrice} />
              </span>
            )}
          </div>
          {showDots && (
            <div
              className="flex items-center gap-1.5 mt-0.5"
              aria-label="Available colours"
            >
              {shown.map((name) => (
                <span
                  key={name}
                  title={name}
                  className="w-3.5 h-3.5 rounded-full border border-ink/15"
                  style={{ background: swatchBackground(name, swatches) }}
                />
              ))}
              {extra > 0 && (
                <span className="text-xs font-body text-ink/60">+{extra}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}