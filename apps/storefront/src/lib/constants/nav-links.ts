export type NavLink = {
  label: string
  href: string
  // "collection" and "category" links are shown only while a collection or category
  // with this handle exists in the live catalogue; "page" links always show.
  kind: "collection" | "category" | "page"
  handle?: string
}

// The header's intended links. Apparel, Footwear, Hair and Makeup stay hidden until
// a category with that handle is created in the admin, then they appear by themselves.
export const NAV_LINKS: NavLink[] = [
  { label: "New In", href: "/collections/new-in", kind: "collection", handle: "new-in" },
  { label: "Apparel", href: "/categories/apparel", kind: "category", handle: "apparel" },
  { label: "Footwear", href: "/categories/footwear", kind: "category", handle: "footwear" },
  { label: "Hair", href: "/categories/hair", kind: "category", handle: "hair" },
  { label: "Makeup", href: "/categories/makeup", kind: "category", handle: "makeup" },
  { label: "Bathing Suits", href: "/categories/bathing-suits", kind: "category", handle: "bathing-suits" },
  { label: "Shop All", href: "/store", kind: "page" },
]

// Keeps only the links whose target exists. A list that is null (the catalogue
// could not be read) hides its links rather than showing ones that may 404.
export const resolveNavLinks = (
  links: NavLink[],
  live: { collections: string[] | null; categories: string[] | null }
): NavLink[] =>
  links.filter((link) => {
    if (link.kind === "page") {
      return true
    }

    const handles = link.kind === "collection" ? live.collections : live.categories

    return !!link.handle && !!handles?.includes(link.handle)
  })
