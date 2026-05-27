"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/base/button"

function Calendar({
  className,
  classNames: userClassNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  const slots = {
    root: cn(
      "w-fit min-w-[calc(7*var(--cell-size)+1.5rem)]",
      defaultClassNames.root,
      userClassNames?.root,
    ),
    months: cn(
      "relative flex flex-col items-start gap-4 md:flex-row md:items-start",
      defaultClassNames.months,
      userClassNames?.months,
    ),
    /** w-fit + min-w matches table width: neither fills the Story canvas nor collapses to a single line if column width is not applied */
    month: cn(
      "flex w-fit min-w-[calc(7*var(--cell-size))] max-w-full flex-col gap-4",
      defaultClassNames.month,
      userClassNames?.month,
    ),
    /** Table width explicitly bound to 7 columns x cell; column width must use var(--cell-size), do not write w-[--cell-size] (Tailwind won't parse it as a length) */
    month_grid: cn(
      "w-[calc(7*var(--cell-size))] border-collapse table-fixed",
      defaultClassNames.month_grid,
      userClassNames?.month_grid,
    ),
    nav: cn(
      "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
      defaultClassNames.nav,
      userClassNames?.nav,
    ),
    button_previous: cn(
      buttonVariants({ variant: buttonVariant }),
      "h-[var(--cell-size)] w-[var(--cell-size)] select-none p-0 aria-disabled:opacity-disabled",
      defaultClassNames.button_previous,
      userClassNames?.button_previous,
    ),
    button_next: cn(
      buttonVariants({ variant: buttonVariant }),
      "h-[var(--cell-size)] w-[var(--cell-size)] select-none p-0 aria-disabled:opacity-disabled",
      defaultClassNames.button_next,
      userClassNames?.button_next,
    ),
    month_caption: cn(
      "flex h-[var(--cell-size)] w-full items-center justify-center px-[var(--cell-size)]",
      defaultClassNames.month_caption,
      userClassNames?.month_caption,
    ),
    dropdowns: cn(
      "flex h-[var(--cell-size)] w-full items-center justify-center gap-2 text-sm font-medium",
      defaultClassNames.dropdowns,
      userClassNames?.dropdowns,
    ),
    dropdown_root: cn(
      "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[var(--ring-width)] relative rounded-md border",
      defaultClassNames.dropdown_root,
      userClassNames?.dropdown_root,
    ),
    dropdown: cn(
      "bg-popover absolute inset-0 opacity-transparent",
      defaultClassNames.dropdown,
      userClassNames?.dropdown,
    ),
    caption_label: cn(
      "select-none font-medium",
      captionLayout === "label"
        ? "text-sm"
        : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-4",
      defaultClassNames.caption_label,
      userClassNames?.caption_label,
    ),
    weekdays: cn("table-row", defaultClassNames.weekdays, userClassNames?.weekdays),
    weekday: cn(
      "text-muted-foreground w-[var(--cell-size)] p-0 text-center text-sm font-normal select-none",
      defaultClassNames.weekday,
      userClassNames?.weekday,
    ),
    week: cn("table-row", defaultClassNames.week, userClassNames?.week),
    week_number_header: cn(
      "w-[var(--cell-size)] select-none",
      defaultClassNames.week_number_header,
      userClassNames?.week_number_header,
    ),
    week_number: cn(
      "text-muted-foreground select-none text-sm",
      defaultClassNames.week_number,
      userClassNames?.week_number,
    ),
    day: cn(
      "group/day relative h-[var(--cell-size)] w-[var(--cell-size)] select-none p-0 text-center align-middle [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
      defaultClassNames.day,
      userClassNames?.day,
    ),
    range_start: cn(
      "bg-accent rounded-l-md",
      defaultClassNames.range_start,
      userClassNames?.range_start,
    ),
    range_middle: cn(
      "rounded-none",
      defaultClassNames.range_middle,
      userClassNames?.range_middle,
    ),
    range_end: cn(
      "bg-accent rounded-r-md",
      defaultClassNames.range_end,
      userClassNames?.range_end,
    ),
    today: cn(
      "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
      defaultClassNames.today,
      userClassNames?.today,
    ),
    outside: cn(
      "text-muted-foreground aria-selected:text-muted-foreground",
      defaultClassNames.outside,
      userClassNames?.outside,
    ),
    disabled: cn(
      "text-muted-foreground opacity-disabled",
      defaultClassNames.disabled,
      userClassNames?.disabled,
    ),
    hidden: cn("invisible", defaultClassNames.hidden, userClassNames?.hidden),
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar shrink-0 p-3 [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        ...slots,
        ...Object.fromEntries(
          Object.entries(userClassNames ?? {}).filter(([key]) => !(key in slots)),
        ),
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[var(--cell-size)] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-[var(--cell-size)] w-full max-w-[var(--cell-size)] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[var(--ring-width)] [&>span]:text-xs [&>span]:opacity-muted",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
