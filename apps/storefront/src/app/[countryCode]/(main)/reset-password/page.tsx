import { Metadata } from "next"

import ResetPassword from "@modules/account/components/reset-password"

// The link carries a reset token in its address, so keep it out of search engines and
// out of the Referer header sent to other sites.
export const metadata: Metadata = {
  title: "Choose a new password",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
  },
}

type Props = {
  searchParams: Promise<{ token?: string | string[]; email?: string | string[] }>
}

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value

export default async function ResetPasswordPage(props: Props) {
  const { token, email } = await props.searchParams

  return (
    <div className="content-container px-4 md:px-6 small:px-8 py-16">
      <ResetPassword token={first(token)} email={first(email)} />
    </div>
  )
}
