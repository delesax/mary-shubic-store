import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
import MedusaCTA from "@modules/layout/components/medusa-cta";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();

  return (
    <footer className="border-t border-ink/10 w-full bg-ivory">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 small:flex-row items-start justify-between py-24 small:py-32 gap-x-16">
          <div className="max-w-xs">
            <LocalizedClientLink
              href="/"
              className="font-display italic text-2xl text-wine"
            >
              Mary Shubic
            </LocalizedClientLink>
            <p className="text-sm text-ink/60 mt-3 leading-relaxed font-body">
              Women&apos;s fashion, hair, makeup, apparel and footwear —
              made for the way you actually live.
            </p>
          </div>

          <div className="text-sm gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-4 w-full small:w-auto">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-xs font-body font-semibold uppercase tracking-widest text-wine">
                  Shop
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li
                        className="flex flex-col gap-2 text-ink/70 text-sm font-body"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-wine transition-colors duration-200",
                            children && "font-medium"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-wine transition-colors duration-200"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-xs font-body font-semibold uppercase tracking-widest text-wine">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ink/70 text-sm font-body",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-wine transition-colors duration-200"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-4">
              <span className="text-xs font-body font-semibold uppercase tracking-widest text-wine">
                Help
              </span>
              {/* TODO: point these at real pages once built */}
              <ul className="grid grid-cols-1 gap-y-2 text-ink/70 text-sm font-body">
                <li>
                  <LocalizedClientLink
                    href="/shipping"
                    className="hover:text-wine transition-colors duration-200"
                  >
                    Shipping
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/returns"
                    className="hover:text-wine transition-colors duration-200"
                  >
                    Returns
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/size-guide"
                    className="hover:text-wine transition-colors duration-200"
                  >
                    Size Guide
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/contact"
                    className="hover:text-wine transition-colors duration-200"
                  >
                    Contact
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-y-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-body font-semibold uppercase tracking-widest text-wine">
                Stay in the loop
              </span>
              <p className="text-sm text-ink/60 font-body">
                Get first access to new drops and edits.
              </p>
              {/* TODO: wire up to real email capture (Klaviyo/Mailchimp/etc.) */}
              <form className="flex border-b border-ink max-w-[240px]">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-transparent py-2 text-sm font-body flex-1 outline-none placeholder:text-ink/40"
                />
                <button
                  type="submit"
                  className="text-xs font-body font-semibold uppercase tracking-wider text-wine hover:text-wine-deep transition-colors duration-200"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between items-center text-ink/50">
          <Text className="text-xs font-body">
            © {new Date().getFullYear()} Mary Shubic. All rights reserved.
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  );
}
