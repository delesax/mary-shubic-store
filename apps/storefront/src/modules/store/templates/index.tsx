import { Suspense } from "react"

import { ProductFilters } from "@lib/constants/product-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import FilterRail from "./filter-rail"
import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: ProductFilters
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div data-testid="category-container">
      <div className="bg-blush py-12 small:py-16 text-center px-6">
        <div className="text-xs font-body uppercase tracking-widest text-wine/65 mb-4">
          Home / All Products
        </div>
        <h1
          className="font-display italic font-medium text-4xl small:text-5xl text-wine-deep"
          data-testid="store-page-title"
        >
          All Products
        </h1>
      </div>

      <div className="flex flex-col small:flex-row small:items-start gap-12 content-container py-10">
        <Suspense fallback={<RefinementList sortBy={sort} />}>
          <FilterRail sortBy={sort} countryCode={countryCode} />
        </Suspense>
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              filters={filters}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
