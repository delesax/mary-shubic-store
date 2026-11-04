import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Mary Shubic | Women's Fashion, Beauty & Footwear",
  description:
    "Apparel, footwear, hair and makeup for women who don't dress to blend in. Shop new arrivals across bold colours and prints, made to move with you.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mary Shubic | Women's Fashion, Beauty & Footwear",
    description:
      "Apparel, footwear, hair and makeup for women who don't dress to blend in.",
    type: "website",
    // TODO: replace with model photography once available
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Mary Shubic",
      },
    ],
  },
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}