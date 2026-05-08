import * as React from "react";

import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="range"
    className={cn(
      "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary",
      "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow",
      "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background",
      className,
    )}
    {...props}
  />
));
Slider.displayName = "Slider";

export { Slider };
