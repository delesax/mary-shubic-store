"use client"

import { searchSuggestions, type SearchSuggestion } from "@lib/data/search"
import {
  normalizeQuery,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
} from "@lib/util/search"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

// Header search: an icon button that opens a search bar under the header. The form is a
// normal GET to /<country>/search, so it works without JavaScript; with JavaScript it adds
// debounced suggestions (combobox pattern: arrow keys, Enter, Escape).
const SearchBox = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { countryCode } = useParams()
  const country = String(countryCode ?? "")

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [items, setItems] = useState<SearchSuggestion[]>([])
  const [active, setActive] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const latest = useRef(0)

  const baseId = useId()
  const panelId = `${baseId}-panel`
  const inputId = `${baseId}-input`
  const listId = `${baseId}-list`

  const close = (returnFocus = false) => {
    setOpen(false)
    setItems([])
    setActive(-1)
    if (returnFocus) {
      buttonRef.current?.focus()
    }
  }

  // Close when the page changes
  useEffect(() => {
    setOpen(false)
    setItems([])
    setActive(-1)
  }, [pathname])

  // Focus the field when the bar opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Close on a click outside the bar
  useEffect(() => {
    if (!open) {
      return
    }
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  // Debounced suggestions; an older, slower answer never replaces a newer one
  useEffect(() => {
    const q = normalizeQuery(value)

    if (!open || q.length < SEARCH_MIN_CHARS) {
      latest.current += 1
      setItems([])
      setActive(-1)
      return
    }

    const id = ++latest.current
    const timer = setTimeout(async () => {
      try {
        const results = await searchSuggestions(q, country)
        if (id === latest.current) {
          setItems(results)
          setActive(-1)
        }
      } catch {
        if (id === latest.current) {
          setItems([])
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, open, country])

  const goToProduct = (item: SearchSuggestion) => {
    close()
    router.push(`/${country}/products/${item.handle}`)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = normalizeQuery(value)
    close()
    router.push(
      `/${country}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`
    )
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      close(true)
    } else if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault()
      setActive((a) => (a + 1) % items.length)
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault()
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1))
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault()
      goToProduct(items[active])
    }
  }

  return (
    <div ref={wrapperRef} className="flex items-center h-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="Search"
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="nav-search-button"
        className="inline-flex h-11 w-11 items-center justify-center text-ink hover:text-wine transition-colors duration-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-40 border-b border-ink/10 bg-ivory shadow-sm"
        >
          <div className="content-container px-4 md:px-6 small:px-8 py-4">
            <form
              role="search"
              method="get"
              action={`/${country}/search`}
              onSubmit={onSubmit}
              className="relative mx-auto max-w-2xl"
            >
              <label htmlFor={inputId} className="sr-only">
                Search the shop
              </label>
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                name="q"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded={items.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  active >= 0 ? `${listId}-${active}` : undefined
                }
                autoComplete="off"
                maxLength={100}
                placeholder="Search products"
                data-testid="nav-search-input"
                className="w-full border-b border-ink bg-transparent py-3 pr-24 text-base text-ink placeholder:text-ink/65 focus:outline-none focus-visible:border-wine"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 text-xs font-semibold uppercase tracking-widest text-ink hover:text-wine"
              >
                Search
              </button>
            </form>

            <ul
              id={listId}
              role="listbox"
              aria-label="Suggestions"
              hidden={items.length === 0}
              className="mx-auto mt-2 max-w-2xl divide-y divide-ink/10"
            >
              {items.map((item, i) => (
                <li
                  key={item.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToProduct(item)}
                  className={
                    "flex min-h-[44px] cursor-pointer items-center gap-x-3 px-1 py-2 text-sm text-ink " +
                    (i === active ? "bg-blush/40" : "hover:bg-blush/30")
                  }
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                    />
                  ) : (
                    <span className="h-10 w-10 bg-blush" aria-hidden="true" />
                  )}
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>

            <p className="sr-only" role="status" aria-live="polite">
              {items.length > 0
                ? `${items.length} suggestion${items.length === 1 ? "" : "s"} available`
                : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBox
