import { Suspense } from "react"

import { SEARCH_MIN_CHARS } from "@lib/util/search"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const SearchTemplate = ({
  query,
  page,
  countryCode,
}: {
  query: string
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) || 1 : 1
  const hasQuery = query.length >= SEARCH_MIN_CHARS

  return (
    <div data-testid="search-container">
      <div className="bg-blush py-12 small:py-16 text-center px-6">
        <h1
          className="font-display italic font-medium text-4xl small:text-5xl text-wine-deep"
          data-testid="search-page-title"
        >
          {query ? `Results for “${query}”` : "Search"}
        </h1>
      </div>

      <div className="content-container px-4 md:px-6 small:px-8 py-10">
        <form
          role="search"
          method="get"
          action={`/${countryCode}/search`}
          className="mx-auto mb-10 max-w-2xl"
        >
          <label
            htmlFor="search-page-input"
            className="mb-2 block text-xs font-body uppercase tracking-widest text-ink/65"
          >
            Search the shop
          </label>
          <div className="flex border-b border-ink focus-within:border-wine focus-within:border-b-2">
            <input
              id="search-page-input"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder="For example: swimsuit"
              data-testid="search-page-input"
              className="w-full bg-transparent py-3 text-base text-ink placeholder:text-ink/65 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 text-xs font-semibold uppercase tracking-widest text-ink hover:text-wine"
            >
              Search
            </button>
          </div>
        </form>

        {!query && (
          <p className="text-center font-body text-sm text-ink/65" data-testid="search-empty-query">
            Type a word above to search the shop.
          </p>
        )}

        {query && !hasQuery && (
          <p className="text-center font-body text-sm text-ink/65" data-testid="search-too-short">
            Please enter at least {SEARCH_MIN_CHARS} characters.
          </p>
        )}

        {hasQuery && (
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy="created_at"
              page={pageNumber}
              countryCode={countryCode}
              query={query}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default SearchTemplate
