import { Suspense } from "react"
import Image from "next/image"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchBox from "@modules/layout/components/search-box"
import LocaleNavControl from "@modules/layout/components/locale-nav-control"
import { NAV_LINKS, resolveNavLinks } from "@lib/constants/nav-links"

export default async function Nav() {
  const [regions, locales, currentLocale, categories, collectionsRes] =
    await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
      // Same calls as the footer, so these come from the same cache entries
      listCategories().catch(() => null),
      listCollections({ fields: "*products" }).catch(() => null),
    ])

  // Only link to categories and collections that exist, so the header never 404s
  const navLinks = resolveNavLinks(NAV_LINKS, {
    categories: categories?.map((c) => c.handle) ?? null,
    collections: collectionsRes?.collections.map((c) => c.handle) ?? null,
  })

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-20 mx-auto border-b duration-200 bg-ivory border-ink/10">
        <nav className="content-container flex items-center justify-between w-full h-full">
          {/* Left column: menu trigger (mobile only) + desktop nav links */}
          <div className="flex-1 basis-0 h-full flex items-center gap-x-6">
            <div className="h-full flex-shrink-0 small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                navLinks={navLinks}
              />
            </div>
            <div className="hidden small:flex items-center gap-x-6 h-full flex-shrink-0">
              {navLinks.map((link) => (
                <LocalizedClientLink
                  key={link.href}
                  href={link.href}
                  className="text-xs font-body font-medium uppercase tracking-widest text-ink pb-1 border-b border-transparent hover:border-wine hover:text-wine transition-colors duration-200 whitespace-nowrap"
                >
                  {link.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          {/* Center column: logo, true center */}
          <div className="flex items-center justify-center h-full flex-1 basis-0">
            <LocalizedClientLink
              href="/"
              className="flex items-center h-full"
              data-testid="nav-store-link"
            >
              <Image
                src="/logo/mary-shubic-logo5-wine-rose.svg"
                alt="Mary Shubic"
                width={220}
                height={60}
                priority
                unoptimized
                className="h-10 w-auto small:h-12"
              />
            </LocalizedClientLink>
          </div>

          {/* Right column: locale control + account + bag */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <SearchBox />
            <LocaleNavControl
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="text-ink hover:text-wine transition-colors duration-200"
                href="/account"
                data-testid="nav-account-link"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-ink hover:text-wine flex gap-2 transition-colors duration-200"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Bag (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}