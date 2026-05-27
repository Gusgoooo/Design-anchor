"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchRootVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-disabled data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
        lg: "h-7 w-12",
      },
    },
    defaultVariants: { size: "default" },
  },
)

const switchThumbVariants = cva(
  "pointer-events-none block self-stretch aspect-square rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "data-[state=checked]:translate-x-4",
        default: "data-[state=checked]:translate-x-5",
        lg: "data-[state=checked]:translate-x-5",
      },
    },
    defaultVariants: { size: "default" },
  },
)

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
  VariantProps<typeof switchRootVariants>

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(switchRootVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitives.Root>
  ),
)
Switch.displayName = SwitchPrimitives.Root.displayName

/** Standalone Thumb re-export for fully custom switch composition. */
const SwitchThumb = SwitchPrimitives.Thumb

export { Switch, SwitchThumb, switchRootVariants, switchThumbVariants }
