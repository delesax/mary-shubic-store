"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images.length) {
    return null
  }

  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col-reverse small:flex-row items-start gap-4">
      <div className="flex small:flex-col gap-3 small:w-[76px] shrink-0 overflow-x-auto small:overflow-visible">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View product image ${index + 1}`}
            className={`relative shrink-0 w-16 h-20 small:w-full small:h-24 rounded-soft overflow-hidden border transition-colors duration-200 ${
              index === activeIndex
                ? "border-wine border-2"
                : "border-ink/10 hover:border-mid-rose"
            }`}
          >
            {!!image.url && (
              <Image
                src={image.url}
                className="object-cover"
                alt={`Product thumbnail ${index + 1}`}
                fill
                sizes="80px"
              />
            )}
          </button>
        ))}
      </div>

      <Container
        className="relative aspect-[3/4] w-full overflow-hidden bg-blush rounded-soft"
        id={activeImage.id}
      >
        {!!activeImage.url && (
          <Image
            src={activeImage.url}
            priority
            className="absolute inset-0"
            alt="Product image"
            fill
            sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            style={{
              objectFit: "cover",
            }}
          />
        )}
      </Container>
    </div>
  )
}

export default ImageGallery
