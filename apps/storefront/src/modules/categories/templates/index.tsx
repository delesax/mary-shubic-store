import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div data-testid="category-container">
      <div className="bg-blush py-12 small:py-16 text-center px-6">
        <div className="text-xs font-body uppercase tracking-widest text-wine/65 mb-4">
          <LocalizedClientLink href="/" className="hover:text-wine">
            Home
          </LocalizedClientLink>
          {parents &&
            parents.map((parent) => (
              <span key={parent.id}>
                {" "}
                /{" "}
                <LocalizedClientLink
                  href={`/categories/${parent.handle}`}
                  className="hover:text-wine"
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
              </span>
            ))}
          {" "}/ {category.name}
        </div>
        <h1
          className="font-display italic font-medium text-4xl small:text-5xl text-wine-deep"
          data-testid="category-page-title"
        >
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-ink/60 font-body mt-3 max-w-lg mx-auto">
            {category.description}
          </p>
        )}
        {category.category_children && category.category_children.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6">
            {category.category_children?.map((c) => (
              <li key={c.id}>
                <InteractiveLink href={`/categories/${c.handle}`}>
                  {c.name}
                </InteractiveLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="flex flex-col small:flex-row small:items-start gap-12 content-container py-10"
        data-testid="category-products-container"
      >
        <RefinementList sortBy={sort} data-testid="sort-by-container" />
        <div className="w-full">
          <Suspense
            fallback={
              <SkeletonProductGrid
                numberOfProducts={category.products?.length ?? 8}
              />
            }
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
