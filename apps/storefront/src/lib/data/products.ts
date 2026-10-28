"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import {
  CONDITIONS,
  PRICE_BANDS,
  ProductFilters,
} from "@lib/constants/product-filters"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

const COLOUR_OPTION_NAMES = ["colour", "color"]
const SIZE_OPTION_NAMES = ["size"]
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

const optionValuesFor = (
  product: HttpTypes.StoreProduct,
  names: string[]
): string[] => {
  const option = (product.options || []).find((o) =>
    names.includes((o.title || "").toLowerCase())
  )
  if (!option) return []
  return (option.values || []).map((v) => v.value)
}

const conditionOf = (product: HttpTypes.StoreProduct): string | null => {
  const value = product.metadata?.condition
  return typeof value === "string" && value.trim() ? value.trim() : null
}

const sizeRank = (size: string) => {
  const idx = SIZE_ORDER.indexOf(size.toUpperCase())
  if (idx >= 0) return idx
  const match = size.match(/\d+(\.\d+)?/)
  return match ? 100 + parseFloat(match[0]) : 1000
}

const includesCI = (list: string[], value: string) =>
  list.some((v) => v.toLowerCase() === value.toLowerCase())

const matchesFilters = (
  product: HttpTypes.StoreProduct,
  filters?: ProductFilters
) => {
  if (!filters) return true

  if (filters.colours.length) {
    const colours = optionValuesFor(product, COLOUR_OPTION_NAMES)
    if (!colours.some((c) => includesCI(filters.colours, c))) return false
  }

  if (filters.sizes.length) {
    const sizes = optionValuesFor(product, SIZE_OPTION_NAMES)
    if (!sizes.some((s) => includesCI(filters.sizes, s))) return false
  }

  if (filters.conditions.length) {
    const condition = conditionOf(product)
    if (!condition || !includesCI(filters.conditions, condition)) return false
  }

  if (filters.prices.length) {
    const { cheapestPrice } = getProductPrice({ product })
    const amount = cheapestPrice?.calculated_price_number
    if (amount === undefined || amount === null) return false
    const inBand = PRICE_BANDS.some(
      (b) =>
        filters.prices.includes(b.key) && amount >= b.min && amount < b.max
    )
    if (!inBand) return false
  }

  return true
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,*options,*options.values,+metadata,+tags",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * Fetches up to 100 products (cached), filters them, sorts them, then
 * returns the requested page. `count` is the number AFTER filtering.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  filters,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  filters?: ProductFilters
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const filtered = products.filter((p) => matchesFilters(p, filters))
  const sortedProducts = sortProducts(filtered, sortBy)
  const count = sortedProducts.length

  const pageParam = (page - 1) * limit
  const nextPage = count > pageParam + limit ? pageParam + limit : null
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

/**
 * Colours, sizes and conditions that actually exist in the (unfiltered)
 * product set, so the filter rail only offers real choices.
 */
export const getProductFacets = async ({
  queryParams,
  countryCode,
}: {
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  colours: { label: string; hex?: string | null }[]
  sizes: string[]
  conditions: string[]
}> => {
  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: { ...queryParams, limit: 100 },
    countryCode,
  })

  const colours: string[] = []
  const sizes: string[] = []

  for (const p of products) {
    for (const c of optionValuesFor(p, COLOUR_OPTION_NAMES)) {
      if (!includesCI(colours, c)) colours.push(c)
    }
    for (const s of optionValuesFor(p, SIZE_OPTION_NAMES)) {
      if (!includesCI(sizes, s)) sizes.push(s)
    }
  }

  colours.sort((a, b) => a.localeCompare(b))
  sizes.sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b))

  return {
    colours: colours.map((label) => ({ label, hex: null })),
    sizes,
    conditions: [...CONDITIONS],
  }
}