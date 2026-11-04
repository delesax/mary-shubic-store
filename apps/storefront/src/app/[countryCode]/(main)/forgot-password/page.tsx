import { Metadata } from "next"

import ForgotPassword from "@modules/account/components/forgot-password"

export const metadata: Metadata = {
  title: "Reset your password",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ForgotPasswordPage() {
  return (
    <div className="content-container px-4 md:px-6 small:px-8 py-16">
      <ForgotPassword />
    </div>
  )
}
