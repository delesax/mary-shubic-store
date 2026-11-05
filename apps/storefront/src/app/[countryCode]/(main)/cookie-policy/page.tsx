import { legalMetadata } from "@lib/util/legal-status"
import LegalPage from "@modules/legal/templates/legal-page"

export const metadata = legalMetadata("cookie-policy")

export default function Page() {
  return <LegalPage slug="cookie-policy" />
}
