"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import { NAV_LINKS } from "@lib/constants/nav-links"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center text-xs font-body font-medium uppercase tracking-widest text-ink transition-colors duration-200 ease-out focus:outline-none hover:text-wine"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-ink/20 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm m-2">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-ivory/95 backdrop-blur-xl border border-ink/10 shadow-xl justify-between p-8"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="text-ink hover:text-wine transition-colors duration-200"
                      >
                        <XMark />
                      </button>
                    </div>

                    <div className="flex flex-col gap-8 items-start justify-start">
                      <ul className="flex flex-col gap-6 items-start justify-start">
                        {NAV_LINKS.map((link) => (
                          <li key={link.href}>
                            <LocalizedClientLink
                              href={link.href}
                              className="font-display italic text-3xl leading-10 text-ink hover:text-wine transition-colors duration-200"
                              onClick={close}
                              data-testid={`${link.label
                                .toLowerCase()
                                .replace(/\s+/g, "-")}-link`}
                            >
                              {link.label}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>

                      <ul className="flex flex-col gap-3 items-start justify-start border-t border-ink/10 pt-6 w-full">
                        <li>
                          <LocalizedClientLink
                            href="/account"
                            className="font-body text-xs uppercase tracking-widest text-ink/60 hover:text-wine transition-colors duration-200"
                            onClick={close}
                            data-testid="account-link"
                          >
                            Account
                          </LocalizedClientLink>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-y-5 border-t border-ink/10 pt-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between items-center"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "text-ink/40 transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between items-center"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "text-ink/40 transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <span className="flex justify-between font-body text-xs text-ink/50">
                        © {new Date().getFullYear()} Mary Shubic. All rights
                        reserved.
                      </span>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu