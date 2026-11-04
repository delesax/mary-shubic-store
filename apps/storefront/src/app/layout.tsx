import { getBaseURL } from "@lib/util/env"
import { SHARE_IMAGE } from "@lib/util/share-image"
import { Metadata } from "next"
import localFont from "next/font/local"
import CookieConsent from "@modules/layout/components/cookie-consent"
import SiteJsonLd from "@modules/layout/components/site-json-ld"
import "styles/globals.css"

const fraunces = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/fraunces-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
})

const workSans = localFont({
  src: [
    {
      path: "../fonts/work-sans-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-work-sans",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  openGraph: {
    images: [SHARE_IMAGE],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${fraunces.variable} ${workSans.variable}`}
    >
      <body className="font-body bg-ivory text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ivory focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:underline focus:shadow-lg"
        >
          Skip to main content
        </a>
        <SiteJsonLd />
        <div className="relative">{props.children}</div>
        <CookieConsent />
      </body>
    </html>
  )
}
