// Default social share image (full logo lockup on white, 1200x630).
// A page that sets its own `openGraph` replaces the root one, so every such
// page must list this explicitly to emit exactly one og:image.
// The URL is relative on purpose: metadataBase (NEXT_PUBLIC_BASE_URL) makes it absolute.
export const SHARE_IMAGE = {
  url: "/images/og-default.png",
  width: 1200,
  height: 630,
  alt: "Mary Shubic",
}
