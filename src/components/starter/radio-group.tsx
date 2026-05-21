"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const radioGroupVariants = cva("grid", {
  variants: {
    orientation: {
      vertical: "grid-flow-row gap-2",
      horizontal: "grid-flow-col auto-cols-max gap-4",
    },
  },
  defaultVariants: { orientation: "vertical" },
})

export type RadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  "orientation"
> &
  VariantProps<typeof radioGroupVariants>

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      orientation={orientation ?? "vertical"}
      className={cn(radioGroupVariants({ orientation }), className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const radioItemVariants = cva(
  "aspect-square rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-disabled",
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

const indicatorIconSize = (size: VariantProps<typeof radioItemVariants>["size"]) => {
  switch (size) {
    case "sm":
      return "h-2 w-2"
    case "lg":
      return "h-3 w-3"
    default:
      return "h-2.5 w-2.5"
  }
}

export type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioItemVariants>

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, size, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioItemVariants({ size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className={cn(indicatorIconSize(size), "fill-current text-current")} aria-hidden />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

const RadioGroupIndicator = RadioGroupPrimitive.Indicator

export { RadioGroup, RadioGroupItem, RadioGroupIndicator, radioGroupVariants, radioItemVariants }
