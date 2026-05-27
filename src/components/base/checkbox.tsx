"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "grid place-content-center peer shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-disabled data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: { size: "default" },
  },
)

const iconSizeFor = (size: VariantProps<typeof checkboxVariants>["size"]) => {
  switch (size) {
    case "sm":
      return "h-2.5 w-2.5"
    case "lg":
      return "h-3.5 w-3.5"
    default:
      return "h-3 w-3"
  }
}

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, checked, ...props }, ref) => {
    const indeterminate = checked === "indeterminate"
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={checked}
        className={cn(checkboxVariants({ size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={cn("grid place-content-center text-current")}>
          {indeterminate ? (
            <Minus className={iconSizeFor(size)} aria-hidden />
          ) : (
            <Check className={iconSizeFor(size)} aria-hidden />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  },
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

/** Standalone Indicator re-export so consumers can render a fully custom indicator. */
const CheckboxIndicator = CheckboxPrimitive.Indicator

export { Checkbox, CheckboxIndicator, checkboxVariants }
