# Cookies, storage and third-party scripts (for the cookie policy)

Compiled 2026-11-04 from the storefront source and the live pages (`/gb`, `/gb/cart`, `/gb/store`).
There are **no analytics, advertising or marketing cookies or scripts** on the storefront.
Re-check this list whenever something is added.

## Cookies set by the storefront (first party, on www.maryshubic.com)

| Name | Purpose | Lifetime | Notes |
|---|---|---|---|
| `_medusa_cart_id` | Remembers your bag and checkout | 7 days | httpOnly, SameSite=Strict, Secure. Strictly necessary. |
| `_medusa_jwt` | Keeps a customer signed in | 7 days | httpOnly, SameSite=Strict, Secure. Only set after sign-in. Strictly necessary. |
| `_medusa_cache_id` | Random id that keeps cached shop data consistent for one visitor | 24 hours | Set on the first page view. Not used to track people. Strictly necessary. |
| `_medusa_locale` | Remembers the chosen language | 1 year | SameSite=Strict, readable by scripts. Only set when a language is chosen (the language selector is hidden while no locales are configured). A user-chosen preference. |
| `_medusa_onboarding` | Admin-onboarding leftover | deleted on use | Not set for customers. |

## Browser storage (not cookies)

| Key | Purpose | Notes |
|---|---|---|
| `localStorage` `ms_cookie_consent` | Stores the visitor's cookie choice (JSON: version, analytics, marketing, saved time) | Written only when a choice is made. The old `ms_cookie_notice_seen` key is no longer used. |

## Third-party scripts and requests

| Service | Where | What it does | Cookies |
|---|---|---|---|
| Stripe (`js.stripe.com`, `*.js.stripe.com`, `hooks.stripe.com`, `api.stripe.com`) | Checkout and the payment return page only (not loaded on `/gb`, `/gb/cart` or `/gb/store`) | Takes payments securely; Stripe.js also does fraud prevention. Strictly necessary for payment. | Stripe sets `__stripe_mid` (about 1 year) and `__stripe_sid` (about 30 minutes) on this site while its script runs. |
| Stripe Link (`link.com`) | Checkout, if Link is shown | Saved-details payment option | Set by Link. |
| Google Pay (`pay.google.com`) | Checkout, only on devices where Google Pay is offered | Wallet payment | Set by Google. |
| Klarna, Revolut Pay | Checkout | Full-page redirects to the provider and back; nothing runs on this site before the redirect | Set by the provider on its own site. |
| Image hosts: `media.maryshubic.com` (Cloudflare R2), `medusa-public-images.s3.eu-west-1.amazonaws.com` (demo images, to be removed) | Product pages | Loading images lets the host see the visitor's IP address | None. |
| Resend (`api.resend.com`) | Newsletter sign-up | Called from our server only, never from the browser | None. |

Fonts and country flags are served from our own site (no external font or flag requests).

## Consent behaviour

* No saved choice means only strictly necessary cookies run.
* **Accept all** and **Reject non-essential** are equally prominent; **Manage preferences** opens per-category toggles (analytics and marketing, both off by default).
* The choice can be changed any time from the footer link **Cookie settings**.
* Any future analytics or marketing script must be wrapped in `ConsentGate` (`modules/layout/components/cookie-consent/consent-gate.tsx`) so it loads only after consent.
* The banner links to `/<country>/cookie-policy`, which does not exist yet and will 404 until the policy pages are built.
