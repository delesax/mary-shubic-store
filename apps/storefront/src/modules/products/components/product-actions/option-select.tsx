import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  // value -> whether any matching variant is in stock (omit to treat all as available)
  availability?: Record<string, { inStock: boolean }>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  availability,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isSize = title.trim().toLowerCase() === "size"

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <span className="text-xs font-body font-semibold uppercase tracking-widest text-ink">
            {title}
          </span>
          {isSize && (
            <LocalizedClientLink
              href="/size-guide"
              className="text-xs font-body text-ink/60 underline hover:text-wine transition-colors duration-200"
            >
              Size guide
            </LocalizedClientLink>
          )}
        </div>
        {current && (
          <span className="text-sm font-body text-ink/60">{current}</span>
        )}
      </div>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const soldOut = availability?.[v]?.inStock === false
          const selected = v === current
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border text-sm font-body h-11 min-w-[44px] px-4 rounded-[2px] transition-colors duration-150",
                {
                  "border-wine bg-wine text-ivory": selected,
                  "border-ink/20 text-ink hover:border-wine":
                    !selected && !soldOut,
                  "border-ink/10 text-ink/30 line-through cursor-not-allowed":
                    !selected && soldOut,
                  "line-through": selected && soldOut,
                }
              )}
              disabled={disabled || (soldOut && !selected)}
              aria-label={soldOut ? `${v}, sold out` : v}
              title={soldOut ? "Sold out" : undefined}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
