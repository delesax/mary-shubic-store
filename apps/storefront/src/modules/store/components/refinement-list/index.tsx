"use client"

import { useEffect, useState } from "react"
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

const SORT_CHOICES = [
  { value: "created_at", label: "Latest Arrivals" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

const headingClass =
  "text-xs font-body font-semibold uppercase tracking-widest text-wine mb-4 pb-2.5 border-b border-ink/10"

const sheetHeadingClass =
  "text-xs font-body font-semibold uppercase tracking-widest text-wine mb-3"

type FilterKey = "colour" | "size" | "price" | "condition"

type Draft = {
  colour: string[]
  size: string[]
  price: string[]
  condition: string[]
  sortBy: string
}

const Chip = ({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-body ${
      on
        ? "border-wine bg-wine text-white"
        : "border-ink/15 text-ink/75 bg-white"
    }`}
  >
    {children}
  </button>
)

const MobileFilters = ({
  sortBy,
  facets,
}: {
  sortBy: SortOptions
  facets?: FilterFacets
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const readDraft = (): Draft => ({
    colour: parseList(searchParams.get("colour") ?? undefined),
    size: parseList(searchParams.get("size") ?? undefined),
    price: parseList(searchParams.get("price") ?? undefined),
    condition: parseList(searchParams.get("condition") ?? undefined),
    sortBy: searchParams.get("sortBy") || sortBy,
  })

  const [draft, setDraft] = useState<Draft>(readDraft)

  const activeCount = FILTER_PARAMS.reduce(
    (sum, p) => sum + parseList(searchParams.get(p) ?? undefined).length,
    0
  )

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const openDrawer = () => {
    setDraft(readDraft())
    setOpen(true)
  }

  const has = (key: FilterKey, value: string) =>
    draft[key].some((v) => v.toLowerCase() === value.toLowerCase())

  const toggle = (key: FilterKey, value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: has(key, value)
        ? d[key].filter((v) => v.toLowerCase() !== value.toLowerCase())
        : [...d[key], value],
    }))

  const clearAll = () =>
    setDraft((d) => ({
      ...d,
      colour: [],
      size: [],
      price: [],
      condition: [],
    }))

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString())
    ;(["colour", "size", "price", "condition"] as FilterKey[]).forEach((key) => {
      if (draft[key].length) {
        params.set(key, draft[key].join(","))
      } else {
        params.delete(key)
      }
    })
    params.set("sortBy", draft.sortBy)
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
    setOpen(false)
  }

  return (
    <>
      <div className="small:hidden -mb-6">
        <button
          type="button"
          onClick={openDrawer}
          className="flex w-full items-center justify-between border-y border-ink/10 py-3.5 text-xs font-body font-semibold uppercase tracking-widest text-wine"
        >
          <span>Filter &amp; sort</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-wine px-2.5 py-0.5 text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end small:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filter and sort"
        >
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <span className="text-sm font-body font-semibold uppercase tracking-widest text-wine">
                Filter &amp; sort
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-2xl leading-none text-ink/60"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-8">
              <div>
                <h5 className={sheetHeadingClass}>Sort by</h5>
                <div className="flex flex-wrap gap-2">
                  {SORT_CHOICES.map((s) => (
                    <Chip
                      key={s.value}
                      on={draft.sortBy === s.value}
                      onClick={() =>
                        setDraft((d) => ({ ...d, sortBy: s.value }))
                      }
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {facets && facets.conditions.length > 0 && (
                <div>
                  <h5 className={sheetHeadingClass}>Condition</h5>
                  <div className="flex flex-wrap gap-2">
                    {facets.conditions.map((label) => (
                      <Chip
                        key={label}
                        on={has("condition", label)}
                        onClick={() => toggle("condition", label)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {facets && facets.colours.length > 0 && (
                <div>
                  <h5 className={sheetHeadingClass}>Colour</h5>
                  <div className="flex flex-wrap gap-2">
                    {facets.colours.map((c) => (
                      <Chip
                        key={c.label}
                        on={has("colour", c.label)}
                        onClick={() => toggle("colour", c.label)}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-ink/20"
                          style={{ background: c.background || "#E9DDD9" }}
                        />
                        {c.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {facets && facets.sizes.length > 0 && (
                <div>
                  <h5 className={sheetHeadingClass}>Size</h5>
                  <div className="flex flex-wrap gap-2">
                    {facets.sizes.map((label) => (
                      <Chip
                        key={label}
                        on={has("size", label)}
                        onClick={() => toggle("size", label)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className={sheetHeadingClass}>Price</h5>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BANDS.map((b) => (
                    <Chip
                      key={b.key}
                      on={has("price", b.key)}
                      onClick={() => toggle("price", b.key)}
                    >
                      {b.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-ink/10 px-5 py-4">
              <button
                type="button"
                onClick={clearAll}
                className="px-2 text-xs font-body uppercase tracking-widest text-wine underline underline-offset-4"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={apply}
                className="flex-1 rounded-full bg-wine py-3.5 text-xs font-body font-semibold uppercase tracking-widest text-white"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

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
    <>
      <MobileFilters sortBy={sortBy} facets={facets} />

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
                        on
                          ? "ring-2 ring-wine ring-offset-2 ring-offset-ivory"
                          : ""
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
    </>
  )
}

export default RefinementList
