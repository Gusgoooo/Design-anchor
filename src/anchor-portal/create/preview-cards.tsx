/**
 * Preview cards — ported from shadcn-ui v4
 *   apps/v4/registry/bases/base/blocks/preview/cards/*
 *
 * Adaptations:
 * - imports rewired @/registry/bases/base/ui/* to @design/*
 * - shadcn's Base UI `render={<Button/>}` slot pattern rewritten as
 *   Radix `asChild` (our base components use Radix primitives)
 * - shadcn's <IconPlaceholder> (multi-library icon) replaced with
 *   direct lucide-react icons
 * - shadcn's style-lyra/style-sera/style-mira responsive variants
 *   dropped — we don't ship those style modes
 * - shadcn's useDesignSystemSearchParams (live preset params) replaced
 *   with static labels; the visual identity comes from our live tokens.
 *
 * Card list (mirrors shadcn's `preview/index.tsx` composition):
 *   StyleOverview, TypographySpecimen, EnvironmentVariables,
 *   IconPreviewGrid, UIElements, BarChartCard, CodespacesCard,
 *   Shortcuts
 */
"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Container,
  Copy,
  Download,
  HardDrive,
  Info,
  Loader2,
  Minus,
  Monitor,
  MoreHorizontal,
  Plus,
  Search,
  Server,
  Settings,
  Share2,
  ShoppingBag,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@design/alert-dialog";
import { Badge } from "@design/badge";
import { Button } from "@design/button";
import { ButtonGroup } from "@design/button-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@design/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@design/chart";
import { Checkbox } from "@design/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@design/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@design/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@design/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@design/field";
import { Input } from "@design/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@design/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemSeparator,
  ItemTitle,
} from "@design/item";
import { Kbd } from "@design/kbd";
import { RadioGroup, RadioGroupItem } from "@design/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@design/select";
import { Separator } from "@design/separator";
import { Slider } from "@design/slider";
import { Spinner } from "@design/spinner";
import { Switch } from "@design/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@design/tabs";
import { Textarea } from "@design/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@design/tooltip";

/* ─── 1. Style Overview ─────────────────────────────────────────────────── */

const SWATCH_VARS = [
  "--background",
  "--foreground",
  "--primary",
  "--secondary",
  "--muted",
  "--accent",
  "--border",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
];

export function StyleOverview() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-medium">Design-anchor</div>
          <div className="line-clamp-2 text-base text-muted-foreground">
            Designers love packing quirky glyphs into test phrases. This is a preview of the typography styles.
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {SWATCH_VARS.map((v) => (
            <div key={v} className="flex flex-col flex-wrap items-center gap-2">
              <div
                className="relative aspect-square w-full rounded-lg after:absolute after:inset-0 after:rounded-lg after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
                style={{ background: `var(${v})` }}
              />
              <div className="hidden max-w-14 truncate font-mono text-xs md:block">{v}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 2. Typography Specimen ────────────────────────────────────────────── */

export function TypographySpecimen() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="text-xs font-medium uppercase text-muted-foreground">Inherit · Inter</div>
        <p className="text-2xl font-medium">Designing with rhythm and hierarchy.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A strong body style keeps long-form content readable and balances the visual weight of headings.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thoughtful spacing and cadence help paragraphs scan quickly without feeling dense.
        </p>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">Share Feedback</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Feedback</DialogTitle>
              <DialogDescription>Let us know how we can improve your experience.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="feedback-name">Name</FieldLabel>
                  <Input id="feedback-name" placeholder="Your name" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="feedback-email">Email</FieldLabel>
                  <Input id="feedback-email" type="email" placeholder="you@example.com" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="feedback-category">Category</FieldLabel>
                <Select defaultValue="general">
                  <SelectTrigger id="feedback-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="feedback-message">Message</FieldLabel>
                <Textarea
                  id="feedback-message"
                  placeholder="Tell us what's on your mind..."
                  className="min-h-24 resize-none"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

/* ─── 3. Environment Variables ──────────────────────────────────────────── */

const ENV_ROWS = [
  { key: "DATABASE_URL", masked: true },
  { key: "NEXT_PUBLIC_API", masked: false },
  { key: "STRIPE_SECRET", masked: true },
] as const;

export function EnvironmentVariables() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>Production · 8 variables</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ENV_ROWS.map((env) => (
          <div
            key={env.key}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 font-mono text-xs ring-1 ring-border"
          >
            <span className="font-medium">{env.key}</span>
            <span className="ml-auto text-muted-foreground">
              {env.masked ? "••••••••" : "https://api.example.com"}
            </span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline">Edit</Button>
        <Button className="ml-auto">Deploy</Button>
      </CardFooter>
    </Card>
  );
}

/* ─── 4. Icon Preview Grid ──────────────────────────────────────────────── */

const ICONS = [
  Copy, CircleAlert, Trash2, Share2, ShoppingBag, MoreHorizontal, Loader2, Plus,
  Minus, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Search, Settings,
] as const;

export function IconPreviewGrid() {
  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-8 place-items-center gap-4">
          {ICONS.map((Icon, i) => (
            <div
              key={i}
              className="flex size-8 items-center justify-center rounded-md ring-1 ring-border"
            >
              <Icon size={16} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 5. UI Elements (the big form/button cluster) ─────────────────────── */

export function UIElements() {
  const [sliderValue, setSliderValue] = React.useState<number[]>([500]);
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button>Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Two-factor authentication</ItemTitle>
              <ItemDescription className="text-pretty xl:hidden 2xl:block">
                Verify via email or phone number.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="hidden md:flex">
              <Button size="sm" variant="secondary">Enable</Button>
            </ItemActions>
          </Item>
        </div>
        <Slider
          value={sliderValue}
          onValueChange={(v) => setSliderValue(v)}
          max={1000}
          min={0}
          step={10}
          className="flex-1"
          aria-label="Slider"
        />
        <FieldGroup>
          <Field>
            <InputGroup>
              <InputGroupInput placeholder="Name" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <Search size={14} />
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field className="flex-1">
            <Textarea placeholder="Message" className="resize-none" />
          </Field>
        </FieldGroup>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <RadioGroup defaultValue="apple" className="ml-auto flex w-fit gap-3">
            <RadioGroupItem value="apple" />
            <RadioGroupItem value="banana" />
          </RadioGroup>
          <div className="flex gap-3">
            <Checkbox defaultChecked />
            <Checkbox />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to allow the USB accessory to connect to this device and your data?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                <AlertDialogAction>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ButtonGroup>
            <Button variant="outline">Group</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronUp size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                  <DropdownMenuItem>Block User</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Conversation</DropdownMenuLabel>
                  <DropdownMenuItem>Share Conversation</DropdownMenuItem>
                  <DropdownMenuItem>Copy Conversation</DropdownMenuItem>
                  <DropdownMenuItem>Report Conversation</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-destructive">Delete Conversation</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <Switch defaultChecked className="ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 6. Bar Chart Card (Traffic channels) ─────────────────────────────── */

const BAR_DATA = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const BAR_CONFIG = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const DESKTOP_TOTAL = BAR_DATA.reduce((s, r) => s + r.desktop, 0);
const MOBILE_TOTAL = BAR_DATA.reduce((s, r) => s + r.mobile, 0);
const MIX_DELTA = Math.round(((DESKTOP_TOTAL - MOBILE_TOTAL) / MOBILE_TOTAL) * 100);

export function BarChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traffic channels</CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-snug">
          Monthly desktop and mobile traffic for the last six months—compare volume and mix across platforms and devices at a glance.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <ChartContainer config={BAR_CONFIG} className="max-h-[180px] w-full">
          <BarChart accessibilityLayer data={BAR_DATA} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              tickFormatter={(v) => String(v).slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="grid w-full grid-cols-3 divide-x divide-border/60">
          <Stat label="Desktop" value={DESKTOP_TOTAL.toLocaleString()} />
          <Stat label="Mobile" value={MOBILE_TOTAL.toLocaleString()} />
          <Stat label="Mix Delta" value={`${MIX_DELTA > 0 ? "+" : ""}${MIX_DELTA}%`} />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View report</Button>
      </CardFooter>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

/* ─── 7. Codespaces Card ────────────────────────────────────────────────── */

export function CodespacesCard() {
  const [creating, setCreating] = React.useState(false);
  return (
    <TooltipProvider>
      <Card>
        <CardContent>
          <Tabs defaultValue="codespaces">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="codespaces" className="w-full">Codespaces</TabsTrigger>
              <TabsTrigger value="local" className="w-full">Local</TabsTrigger>
            </TabsList>
            <TabsContent value="codespaces">
              <Item size="sm" className="px-1 pt-2">
                <ItemContent>
                  <ItemTitle>Codespaces</ItemTitle>
                  <ItemDescription>Your workspaces in the cloud</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Plus size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Create a codespace on main</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuItem><Plus size={14} className="mr-2" />New with options...</DropdownMenuItem>
                        <DropdownMenuItem><Container size={14} className="mr-2" />Configure dev container</DropdownMenuItem>
                        <DropdownMenuItem><Zap size={14} className="mr-2" />Set up prebuilds</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem><Server size={14} className="mr-2" />Manage codespaces</DropdownMenuItem>
                        <DropdownMenuItem><Share2 size={14} className="mr-2" />Share deep link</DropdownMenuItem>
                        <DropdownMenuItem><Info size={14} className="mr-2" />What are codespaces?</DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
              <Separator className="-mx-2 my-2 w-auto" />
              <Empty className="p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HardDrive size={16} />
                  </EmptyMedia>
                  <EmptyTitle>No codespaces</EmptyTitle>
                  <EmptyDescription>
                    You don&apos;t have any codespaces with this repository checked out
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCreating(true);
                      setTimeout(() => setCreating(false), 2000);
                    }}
                    disabled={creating}
                  >
                    {creating ? <Spinner /> : null}
                    Create Codespace
                  </Button>
                  <a href="#learn-more" className="text-xs text-muted-foreground underline underline-offset-4">
                    Learn more about codespaces
                  </a>
                </EmptyContent>
              </Empty>
              <Separator className="-mx-2 my-2 w-auto" />
              <div className="p-1.5 text-xs text-muted-foreground">
                Codespace usage for this repository is paid for by <span className="font-medium">shadcn</span>.
              </div>
            </TabsContent>
            <TabsContent value="local">
              <Tabs defaultValue="https">
                <TabsList variant="underline" className="w-full justify-start border-b">
                  <TabsTrigger variant="underline" value="https">HTTPS</TabsTrigger>
                  <TabsTrigger variant="underline" value="ssh">SSH</TabsTrigger>
                  <TabsTrigger variant="underline" value="cli">GitHub CLI</TabsTrigger>
                </TabsList>
                <div className="rounded-md border bg-muted/30 p-2">
                  <CloneUrl id="https" defaultValue="https://github.com/shadcn-ui/ui.git" hint="Clone using the web URL." />
                  <CloneUrl id="ssh" defaultValue="git@github.com:shadcn-ui/ui.git" hint="Use a password-protected SSH key." tab="ssh" />
                  <CloneUrl id="cli" defaultValue="gh repo clone shadcn-ui/ui" hint={<>Work fast with our official CLI. <a href="#learn-more">Learn more</a></>} tab="cli" />
                </div>
              </Tabs>
              <Separator className="-mx-2 my-2 w-auto" />
              <div className="flex flex-col">
                <Button variant="ghost" size="sm" className="justify-start gap-1.5">
                  <Monitor size={14} className="mr-2" /> Open with GitHub Desktop
                </Button>
                <Button variant="ghost" size="sm" className="justify-start gap-1.5">
                  <Download size={14} className="mr-2" /> Download ZIP
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function CloneUrl({
  id,
  defaultValue,
  hint,
  tab = "https",
}: {
  id: string;
  defaultValue: string;
  hint: React.ReactNode;
  tab?: string;
}) {
  return (
    <TabsContent value={tab}>
      <Field className="gap-2">
        <FieldLabel htmlFor={`${id}-url`} className="sr-only">URL</FieldLabel>
        <InputGroup>
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="ghost" size="icon-xs">
              <Copy size={12} />
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupInput id={`${id}-url`} defaultValue={defaultValue} readOnly />
        </InputGroup>
        <FieldDescription>{hint}</FieldDescription>
      </Field>
    </TabsContent>
  );
}

/* ─── 8. Shortcuts ──────────────────────────────────────────────────────── */

const SHORTCUTS = [
  { label: "Search", keys: ["⌘", "K"] },
  { label: "Quick Actions", keys: ["⌘", "J"] },
  { label: "New File", keys: ["⌘", "N"] },
  { label: "Save", keys: ["⌘", "S"] },
  { label: "Toggle Sidebar", keys: ["⌘", "B"] },
] as const;

export function Shortcuts() {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Shortcuts</div>
          <ItemGroup className="gap-2 text-muted-foreground">
            {SHORTCUTS.map(({ label, keys }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <ItemSeparator />}
                <Item variant="default" size="sm" className={cn("border-0 px-0 py-0")}>
                  <ItemHeader>
                    <ItemTitle className="font-normal">{label}</ItemTitle>
                    <ItemActions>
                      <div className="flex gap-1">
                        {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
                      </div>
                    </ItemActions>
                  </ItemHeader>
                </Item>
              </React.Fragment>
            ))}
          </ItemGroup>
        </div>
      </CardContent>
    </Card>
  );
}
