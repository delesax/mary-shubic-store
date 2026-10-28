import { MetadataRoute } from "next"

const BASE = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.maryshubic.com"
).replace(/\/$/, "")

// Filtered listing URLs are deliberately NOT blocked here: they carry a
// noindex tag, and Google can only see that tag if it is allowed to crawl them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*/cart", "/*/checkout", "/*/account", "/*/order"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
