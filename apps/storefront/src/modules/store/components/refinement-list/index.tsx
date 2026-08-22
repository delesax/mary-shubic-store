"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  "data-testid"?: string
}

// TODO: these are placeholders for layout only — not wired to real query
// params or backend filtering yet. Need to confirm how colour/size are
// modeled on the Medusa products (variant options vs metadata) before
// wiring this up for real.
const CATEGORY_FILTERS = ["Dresses", "Tops", "Skirts", "Outerwear"]
const COLOUR_FILTERS = [
  { label: "Neon Coral", hex: "#FF6B4A" },
  { label: "Green Leopard", hex: "#5B7A4F" },
  { label: "Orange Floral", hex: "#E8A13D" },
  { label: "Navy Polka Dot", hex: "#2C3E5C" },
]
const SIZE_FILTERS = ["XS", "S", "M", "L", "XL"]
const PRICE_FILTERS = ["Under £25", "£25 – £50", "£50 – £100", "£100+"]

const RefinementList = ({
  sortBy,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="hidden small:flex flex-col gap-10 small:min-w-[220px] small:pr-4">
      <div>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </div>

      <div>
        <h5 className="text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10">
          Category
        </h5>
        <div className="flex flex-col gap-3">
          {CATEGORY_FILTERS.map((label) => (
            <label
              key={label}
              className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-wine"
                disabled
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10">
          Colour
        </h5>
        <div className="flex flex-col gap-3">
          {COLOUR_FILTERS.map((c) => (
            <button
              key={c.label}
              type="button"
              disabled
              className="flex items-center gap-2.5 text-sm font-body text-ink/75 text-left cursor-not-allowed"
            >
              <span
                className="w-4 h-4 rounded-full border border-ink/15"
                style={{ backgroundColor: c.hex }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10">
          Size
        </h5>
        <div className="flex flex-col gap-3">
          {SIZE_FILTERS.map((label) => (
            <label
              key={label}
              className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-wine"
                disabled
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10">
          Price
        </h5>
        <div className="flex flex-col gap-3">
          {PRICE_FILTERS.map((label) => (
            <label
              key={label}
              className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-wine"
                disabled
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RefinementList
