import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

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
        </div>
      </div>
    </LocalizedClientLink>
  )
}
