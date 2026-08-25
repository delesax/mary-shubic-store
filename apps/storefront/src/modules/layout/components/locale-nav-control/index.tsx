"use client"

import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import { Fragment } from "react"
import ReactCountryFlag from "react-country-flag"
import { useParams } from "next/navigation"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

type LocaleNavControlProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const LocaleNavControl = ({
  regions,
  locales,
  currentLocale,
}: LocaleNavControlProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const { countryCode } = useParams()

  return (
    <Popover className="relative h-full hidden small:flex items-center">
      <PopoverButton
        className="flex items-center gap-x-1.5 text-ink hover:text-wine transition-colors duration-200"
        data-testid="nav-locale-button"
      >
        {countryCode ? (
          /* @ts-ignore */
          <ReactCountryFlag
            svg
            style={{ width: "16px", height: "16px" }}
            countryCode={(countryCode as string).toUpperCase()}
          />
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9Z" />
          </svg>
        )}
        <span className="text-xs font-body uppercase tracking-widest">
          {countryCode ?? ""}
        </span>
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel
          className="absolute top-[calc(100%+1px)] right-0 bg-ivory border border-ink/10 shadow-lg w-64 p-4 flex flex-col gap-y-4 text-ink z-50"
          data-testid="nav-locale-panel"
        >
          {regions && (
            <CountrySelect toggleState={countryToggleState} regions={regions} />
          )}
          {!!locales?.length && (
            <LanguageSelect
              toggleState={languageToggleState}
              locales={locales}
              currentLocale={currentLocale}
            />
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}

export default LocaleNavControl