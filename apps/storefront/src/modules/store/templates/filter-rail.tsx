import { getColourSwatches } from "@lib/data/colour-swatches"
import { getProductFacets } from "@lib/data/products"
import { swatchBackground } from "@lib/util/colour-swatch"
import RefinementList, {
  FilterFacets,
} from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export default async function FilterRail({
  sortBy,
  countryCode,
  categoryId,
  collectionId,
  "data-testid": dataTestId,
}: {
  sortBy: SortOptions
  countryCode: string
  categoryId?: string
  collectionId?: string
  "data-testid"?: string
}) {
  const queryParams: { category_id?: string[]; collection_id?: string[] } = {}
  if (categoryId) queryParams.category_id = [categoryId]
  if (collectionId) queryParams.collection_id = [collectionId]

  let facets: FilterFacets | undefined

  try {
    const [raw, swatches] = await Promise.all([
      getProductFacets({ queryParams, countryCode }),
      getColourSwatches(),
    ])

    facets = {
      colours: raw.colours.map((c) => ({
        label: c.label,
        background: swatchBackground(c.label, swatches),
      })),
      sizes: raw.sizes,
      conditions: raw.conditions,
    }
  } catch {
    facets = undefined
  }

  return (
    <RefinementList sortBy={sortBy} facets={facets} data-testid={dataTestId} />
  )
}
