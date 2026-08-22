import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces, Work_Sans } from "next/font/google"
import "styles/globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
  display: "swap",
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
      </body>
    </html>
  )
}
