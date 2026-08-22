import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
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
        <RefinementList sortBy={sort} />
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
