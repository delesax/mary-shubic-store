import LocalizedClientLink from "@modules/common/components/localized-client-link"

const LINK = "text-wine underline hover:text-wine/80"

// Opens in a new tab so a customer can read a policy without leaving checkout (the bag is
// kept in a cookie either way).
const PolicyLink = ({ href, children }: { href: string; children: string }) => (
  <LocalizedClientLink href={href} className={LINK} target="_blank" rel="noopener">
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </LocalizedClientLink>
)

// The consent line next to the Place order button. Text only: no checkout logic.
const LegalAgreement = () => (
  <p className="text-sm text-ink/70" data-testid="checkout-legal-agreement">
    By placing your order you agree to our{" "}
    <PolicyLink href="/terms">Terms and Conditions</PolicyLink>,{" "}
    <PolicyLink href="/shipping">Delivery Policy</PolicyLink>,{" "}
    <PolicyLink href="/returns">Returns and Refunds Policy</PolicyLink> and{" "}
    <PolicyLink href="/privacy-policy">Privacy Policy</PolicyLink>.
  </p>
)

export default LegalAgreement
