import type { Appearance, StripeElementsOptions } from "@stripe/stripe-js"
import { getBaseURL } from "@lib/util/env"

// Brand styling for Stripe's Payment Element (wine accent, ivory panels, site radius).
export const stripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#7A3B44",
    colorBackground: "#FAF3F0",
    colorText: "#2A1A1D",
    colorTextSecondary: "rgba(42, 26, 29, 0.6)",
    colorDanger: "#B3261E",
    fontFamily: "Work Sans, system-ui, sans-serif",
    fontSizeBase: "14px",
    borderRadius: "6px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(42, 26, 29, 0.15)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #7A3B44",
      boxShadow: "none",
    },
    ".Label": {
      fontWeight: "500",
    },
    ".AccordionItem": {
      border: "1px solid rgba(42, 26, 29, 0.15)",
      boxShadow: "none",
    },
    ".AccordionItem--selected": {
      border: "1px solid #7A3B44",
    },
  },
}

// Stripe renders inside its own iframe and cannot see the site's local fonts, so the
// Work Sans file is served from public/fonts (CORS header set in the Caddyfile).
export const stripeFonts: StripeElementsOptions["fonts"] = [
  {
    family: "Work Sans",
    src: `url(${getBaseURL().replace(/\/$/, "")}/fonts/work-sans-latin-wght-normal.woff2)`,
    weight: "100 900",
    display: "swap",
  },
]
