import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { controlFieldSizeCore } from "./control-field-size";

const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border border-input bg-transparent shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-disabled",
  {
    variants: {
      size: {
        sm: cn(controlFieldSizeCore.sm, "px-2.5 py-0 file:mr-2"),
        default: cn(controlFieldSizeCore.default, "px-3 py-1 file:mr-2 file:py-1"),
        lg: cn(controlFieldSizeCore.lg, "px-4 py-1.5 file:mr-3 file:py-1.5"),
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, size, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ size }), className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input, inputVariants };
