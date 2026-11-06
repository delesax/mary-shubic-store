import { Label } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched: _touched, required, topLabel, id, ...props }, ref) => {
    // Field names repeat on some pages (the address book renders the add form and one
    // edit form per address), so default to a unique React id rather than the name.
    // An id passed by the caller (forgot/reset password, discount code) is kept.
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 text-xs font-body uppercase tracking-widest text-ink/65">
            {topLabel}
          </Label>
        )}
        <div className="flex relative z-0 w-full font-body text-sm">
          <input
            id={inputId}
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            className="peer pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ivory text-ink border border-ink/15 rounded-md appearance-none focus:outline-none focus:ring-0 focus:border-wine hover:bg-blush/10 transition-colors duration-200"
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={inputId}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ink/65 font-body peer-focus:text-wine"
          >
            {label}
            {required && <span className="text-wine">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ink/65 px-4 focus:outline-none transition-all duration-150 outline-none hover:text-wine absolute right-0 top-3"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input