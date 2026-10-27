"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { PRICE_BANDS, parseList } from "@lib/constants/product-filters"
import SortProducts, { SortOptions } from "./sort-products"

export type FilterFacets = {
  colours: { label: string; background?: string | null }[]
  sizes: string[]
  conditions: string[]
}

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  facets?: FilterFacets
  "data-testid"?: string
}

const FILTER_PARAMS = ["colour", "size", "price", "condition"]

const headingClass =
  "text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10"

const RefinementList = ({
  sortBy,
  facets,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const push = (params: URLSearchParams) => {
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const setQueryParams = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    push(params)
  }

  const selected = (name: string) =>
    parseList(searchParams.get(name) ?? undefined)

  const isSelected = (name: string, value: string) =>
    selected(name).some((v) => v.toLowerCase() === value.toLowerCase())

  const toggle = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const current = selected(name)
    const next = isSelected(name, value)
      ? current.filter((v) => v.toLowerCase() !== value.toLowerCase())
      : [...current, value]

    if (next.length) {
      params.set(name, next.join(","))
    } else {
      params.delete(name)
    }
    push(params)
  }

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_PARAMS.forEach((p) => params.delete(p))
    push(params)
  }

  const hasActive = FILTER_PARAMS.some((p) => searchParams.get(p))

  return (
    <div className="hidden small:flex flex-col gap-10 small:min-w-[220px] small:pr-4">
      <div>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start text-xs font-body uppercase tracking-widest text-wine underline underline-offset-4"
        >
          Clear filters
        </button>
      )}

      {facets && facets.conditions.length > 0 && (
        <div>
          <h5 className={headingClass}>Condition</h5>
          <div className="flex flex-col gap-3">
            {facets.conditions.map((label) => (
              <label
                key={label}
                className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-wine"
                  checked={isSelected("condition", label)}
                  onChange={() => toggle("condition", label)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {facets && facets.colours.length > 0 && (
        <div>
          <h5 className={headingClass}>Colour</h5>
          <div className="flex flex-col gap-3">
            {facets.colours.map((c) => {
              const on = isSelected("colour", c.label)
              return (
                <button
                  key={c.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("colour", c.label)}
                  className={`flex items-center gap-2.5 text-sm font-body text-left ${
                    on ? "text-wine font-medium" : "text-ink/75"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border border-ink/15 ${
                      on ? "ring-2 ring-wine ring-offset-2 ring-offset-ivory" : ""
                    }`}
                    style={{ background: c.background || "#E9DDD9" }}
                  />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {facets && facets.sizes.length > 0 && (
        <div>
          <h5 className={headingClass}>Size</h5>
          <div className="flex flex-col gap-3">
            {facets.sizes.map((label) => (
              <label
                key={label}
                className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-wine"
                  checked={isSelected("size", label)}
                  onChange={() => toggle("size", label)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h5 className={headingClass}>Price</h5>
        <div className="flex flex-col gap-3">
          {PRICE_BANDS.map((b) => (
            <label
              key={b.key}
              className="flex items-center gap-2.5 text-sm font-body text-ink/75 cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-wine"
                checked={isSelected("price", b.key)}
                onChange={() => toggle("price", b.key)}
              />
              {b.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RefinementList