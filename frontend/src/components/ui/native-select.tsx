import * as React from "react"
import { cn } from "@/lib/utils"

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative min-w-[240px]">
        <select
          ref={ref}
          className={cn(
            "peer w-full appearance-none rounded-xl border border-primary-light bg-white pl-4 pr-10 py-2 text-xs font-bold text-primary-dark outline-none transition-all hover:border-primary-light focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-primary-light0 peer-focus:text-primary-dark transition-colors">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }
)
NativeSelect.displayName = "NativeSelect"

export interface NativeSelectOptGroupProps
  extends React.OptgroupHTMLAttributes<HTMLOptGroupElement> {
  label: string
}

const NativeSelectOptGroup = React.forwardRef<
  HTMLOptGroupElement,
  NativeSelectOptGroupProps
>(({ className, label, children, ...props }, ref) => {
  return (
    <optgroup
      ref={ref}
      label={label}
      className={cn(
        "bg-white font-bold text-xs text-gray-400",
        className
      )}
      {...props}
    >
      {children}
    </optgroup>
  )
})
NativeSelectOptGroup.displayName = "NativeSelectOptGroup"

export interface NativeSelectOptionProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const NativeSelectOption = React.forwardRef<
  HTMLOptionElement,
  NativeSelectOptionProps
>(({ className, children, ...props }, ref) => {
  return (
    <option
      ref={ref}
      className={cn(
        "bg-white font-semibold text-xs text-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </option>
  )
})
NativeSelectOption.displayName = "NativeSelectOption"

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
