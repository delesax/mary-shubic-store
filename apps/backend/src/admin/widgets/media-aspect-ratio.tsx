import { defineWidgetConfig } from "@medusajs/admin-sdk"

// Fixes cropped thumbnails in the Product Details > Media section.
// The Media gallery wraps each thumbnail in a square (`aspect-square`)
// container and uses `object-fit: cover` on the <img>, which crops the
// top/bottom off rectangular images. This overrides it to `contain` so
// the full image is visible, letterboxed inside the square frame.
const MediaAspectRatioWidget = () => {
  return (
    <style>{`
      /* Scoped to the Media gallery thumbnail wrapper on the product
         details page only (aspect-square + overflow-hidden together
         is unique to that section — doesn't touch variant tables,
         avatars, or other thumbnails elsewhere in the admin). */
      .aspect-square.overflow-hidden img.object-cover {
        object-fit: contain !important;
        background-color: #f4f4f5;
      }
    `}</style>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default MediaAspectRatioWidget
