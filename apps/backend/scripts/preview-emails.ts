// Renders every email template with sample data to HTML and text files, so they can be
// opened in a browser without sending anything.
//
//   npm run preview:emails            (from apps/backend; writes to ./email-previews)
//   npm run preview:emails -- ./some/folder
//
// Uses esbuild, which is already installed through Medusa; no new dependency.
import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { renderOrderCanceledEmail } from "../src/modules/resend/emails/order-canceled"
import { renderOrderPlacedEmail } from "../src/modules/resend/emails/order-placed"
import { renderOrderShippedEmail } from "../src/modules/resend/emails/order-shipped"
import { renderPasswordResetEmail } from "../src/modules/resend/emails/password-reset"

const order = {
  id: "order_01SAMPLE",
  display_id: 1042,
  currency_code: "gbp",
  total: 61.98,
  item_total: 54,
  tax_total: 10.33,
  items: [
    {
      id: "item_1",
      product_title: "Tribal Print Halter Swimsuit",
      variant_title: "Black / UK 8",
      thumbnail: null,
      quantity: 1,
      total: 28,
    },
    {
      id: "item_2",
      product_title: "Floral Panel Halter Swimsuit",
      variant_title: "Pink / UK 10",
      thumbnail: null,
      quantity: 2,
      total: 26,
    },
  ],
  shipping_address: {
    first_name: "Jo",
    last_name: "Bloggs",
    address_1: "1 Example Road",
    address_2: "Flat 2",
    city: "London",
    province: null,
    postal_code: "SW1A 1AA",
    country_code: "gb",
  },
  shipping_methods: [{ id: "sm_1", name: "Standard delivery", total: 3.99 }],
}

const samples = {
  "order-placed": renderOrderPlacedEmail({ order }),
  "order-shipped": renderOrderShippedEmail({
    order,
    fulfillment: {
      items: [{ title: "Tribal Print Halter Swimsuit", quantity: 1, line_item_id: "item_1" }],
      labels: [
        {
          tracking_number: "AB123456789GB",
          tracking_url: "https://www.royalmail.com/track-your-item",
        },
      ],
    },
  }),
  "order-shipped-no-tracking": renderOrderShippedEmail({
    order,
    fulfillment: { items: [], labels: [] },
  }),
  "order-canceled": renderOrderCanceledEmail({ order }),
  "password-reset": renderPasswordResetEmail({
    resetUrl:
      "https://www.maryshubic.com/gb/account/reset-password?token=SAMPLE.TOKEN&email=jo%40example.com",
    firstName: "Jo",
    expiresInMinutes: 15,
  }),
}

const outDir = resolve(process.argv[2] ?? "./email-previews")
mkdirSync(outDir, { recursive: true })

for (const [name, email] of Object.entries(samples)) {
  writeFileSync(join(outDir, `${name}.html`), email.html)
  writeFileSync(join(outDir, `${name}.txt`), email.text)
  console.log(`wrote ${join(outDir, name)}.html and .txt`)
}
