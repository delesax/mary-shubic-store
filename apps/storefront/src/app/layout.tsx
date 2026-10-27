import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import localFont from "next/font/local"
import CookieNotice from "@modules/layout/components/cookie-notice"
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
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${fraunces.variable} ${workSans.variable}`}
    >
      <body className="font-body bg-ivory text-ink">
        <main className="relative">{props.children}</main>
        <CookieNotice />
      </body>
    </html>
  )
}
