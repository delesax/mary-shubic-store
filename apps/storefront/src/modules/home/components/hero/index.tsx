import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="w-full border-b border-ink/10 bg-ivory">
      <div className="grid small:grid-cols-[1.1fr_0.9fr] w-full min-h-[70vh] small:min-h-[640px]">
        <div className="flex flex-col justify-center px-6 small:px-16 py-16 small:py-0 order-2 small:order-1">
          <span className="text-xs font-body font-semibold uppercase tracking-widest text-mid-rose mb-5">
            New Season
          </span>
          <Heading
            level="h1"
            className="font-display font-medium text-[2.6rem] small:text-[4.2rem] leading-[1.05] text-wine-deep mb-6"
          >
            Made to move,
            <br />
            made to be <em className="italic font-normal text-wine">felt</em>
          </Heading>
          <p className="font-body text-base text-ink/75 max-w-md mb-9 leading-relaxed">
            Apparel, footwear, hair and makeup for women who don&apos;t dress
            to blend in. Shop the new arrivals before they&apos;re gone.
          </p>
          <LocalizedClientLink
            href="/store"
            className="inline-block bg-wine hover:bg-wine-deep text-ivory px-9 py-4 text-xs font-body font-semibold uppercase tracking-widest transition-colors duration-200 w-fit"
          >
            Shop New In
          </LocalizedClientLink>
        </div>
        <div className="relative bg-gradient-to-br from-blush to-mid-rose flex items-center justify-center order-1 small:order-2 min-h-[360px]">
          {/* TODO: replace with AI-generated model photography */}
          <span className="font-display italic text-white/60 text-lg">
            Model Photo
          </span>
        </div>
      </div>
    </div>
  )
}

export default Hero
