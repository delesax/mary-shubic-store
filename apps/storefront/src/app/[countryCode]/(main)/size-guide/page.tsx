import { Metadata } from "next"

import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Size Guide | Mary Shubic",
  description:
    "UK, EU and US size conversions and how to measure yourself for the best fit.",
}

// UK / EU / US conversions (same chart as the catalogue spreadsheet).
const CLOTHING = [
  ["UK 6", "34", "2"],
  ["UK 8", "36", "4"],
  ["UK 10", "38", "6"],
  ["UK 12", "40", "8"],
  ["UK 14", "42", "10"],
  ["UK 16", "44", "12"],
  ["UK 18", "46", "14"],
]

const BRA = [
  ["32", "70", "32"],
  ["34", "75", "34"],
  ["36", "80", "36"],
  ["38", "85", "38"],
]

const SHOES = [
  ["UK 3", "36", "5"],
  ["UK 4", "37", "6"],
  ["UK 5", "38", "7"],
  ["UK 6", "39", "8"],
  ["UK 7", "40", "9"],
  ["UK 8", "41", "10"],
]

// Optional: body measurements in cm per UK size. Leave empty until you have
// your supplier's chart; the table is hidden while this is empty.
// Row format: ["UK 8", "bust", "waist", "hips"], e.g. ["UK 8", "83", "63", "88"]
const MEASUREMENTS: string[][] = []

const Table = ({ heads, rows }: { heads: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full max-w-xl text-left text-sm font-body text-ink/80">
      <thead>
        <tr className="border-b border-ink/20 text-xs uppercase tracking-widest text-ink">
          {heads.map((h) => (
            <th key={h} className="py-3 pr-6 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.join("-")} className="border-b border-ink/10">
            {r.map((c, i) => (
              <td key={i} className="py-3 pr-6">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ product?: string }>
}

export default async function SizeGuidePage(props: Props) {
  const { countryCode } = await props.params
  const { product } = await props.searchParams

  let back = { href: "/store", label: "Back to shop" }

  if (product && /^[a-z0-9-]+$/i.test(product)) {
    try {
      const { response } = await listProducts({
        countryCode,
        queryParams: { handle: product },
      })
      const found = response.products[0]
      if (found) {
        back = {
          href: `/products/${found.handle}`,
          label: `Back to ${found.title}`,
        }
      }
    } catch {
      // keep the "Back to shop" fallback
    }
  }

  return (
    <div className="content-container py-16 small:py-24">
      <div className="mb-8">
        <LocalizedClientLink
          href={back.href}
          className="inline-flex max-w-full items-center gap-x-2 text-sm font-body text-ink/60 hover:text-wine transition-colors duration-200"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="min-w-0 truncate">{back.label}</span>
        </LocalizedClientLink>
      </div>
      <h1 className="font-display italic text-4xl text-wine">Size guide</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 font-body">
        All our sizes are UK sizes. Use the tables below to convert to EU or US
        sizing. Fit can vary a little between styles, so check the description
        on each product page.
      </p>

      <section className="mt-12 flex flex-col gap-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink font-body">
          Clothing and swimwear
        </h2>
        <Table heads={["UK", "EU", "US"]} rows={CLOTHING} />
      </section>

      {MEASUREMENTS.length > 0 && (
        <section className="mt-12 flex flex-col gap-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink font-body">
            Body measurements (cm)
          </h2>
          <Table heads={["UK", "Bust", "Waist", "Hips"]} rows={MEASUREMENTS} />
        </section>
      )}

      <section className="mt-12 flex flex-col gap-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink font-body">
          Bra band sizes
        </h2>
        <Table heads={["UK band", "EU band", "US band"]} rows={BRA} />
        <p className="max-w-xl text-sm text-ink/60 font-body">
          Cup sizes (A to D) are the same in UK, EU and US sizing.
        </p>
      </section>

      <section className="mt-12 flex flex-col gap-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink font-body">
          Footwear
        </h2>
        <Table heads={["UK", "EU", "US"]} rows={SHOES} />
      </section>

      <section className="mt-12 flex max-w-xl flex-col gap-y-3 font-body">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink">
          How to measure
        </h2>
        <ul className="list-disc pl-5 text-sm leading-relaxed text-ink/70 space-y-2">
          <li>
            <span className="font-semibold text-ink">Bust:</span> around the
            fullest part of your chest, keeping the tape level.
          </li>
          <li>
            <span className="font-semibold text-ink">Waist:</span> around the
            narrowest part of your waist.
          </li>
          <li>
            <span className="font-semibold text-ink">Hips:</span> around the
            fullest part of your hips.
          </li>
          <li>
            <span className="font-semibold text-ink">Band (bras):</span> snugly
            around your ribcage, just under the bust.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-ink/60">
          Between sizes? Check the product description or contact us and
          we&apos;ll help you choose.
        </p>
      </section>
    </div>
  )
}
