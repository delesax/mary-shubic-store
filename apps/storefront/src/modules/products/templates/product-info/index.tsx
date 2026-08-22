import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-xs font-body font-semibold uppercase tracking-widest text-mid-rose hover:text-wine transition-colors duration-200 w-fit"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="font-display font-medium text-3xl small:text-4xl leading-tight text-wine-deep"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-sm font-body text-ink/70 leading-relaxed whitespace-pre-line max-w-md"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
