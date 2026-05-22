import * as React from "react";
import {
  Bell,
  Check,
  Copy,
  Download,
  Edit3,
  Filter,
  Heart,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/base/button";
import { Input } from "@/components/base/input";
import { Textarea } from "@/components/base/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/base/card";
import { Badge } from "@/components/base/badge";
import { Slider } from "@/components/base/slider";
import { Switch } from "@/components/base/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/base/tabs";
import { Checkbox } from "@/components/base/checkbox";
import { Toggle } from "@/components/base/toggle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/base/alert-dialog";

const PREVIEW_ROOT_ATTR = "data-anchor-preview";

/** Stringify resolvedVars as a CSS rule scoped to the preview root. */
function buildScopedCss(vars: Record<string, string>): string {
  const decls = Object.entries(vars)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ");
  return `[${PREVIEW_ROOT_ATTR}] { ${decls} }`;
}

export function PreviewBoard({
  vars,
  darkMode,
}: {
  vars: Record<string, string>;
  darkMode: boolean;
}) {
  const css = React.useMemo(() => buildScopedCss(vars), [vars]);

  return (
    <div
      {...{ [PREVIEW_ROOT_ATTR]: "" }}
      className={cn(
        "relative h-full w-full overflow-y-auto bg-muted/40 p-6",
        darkMode && "dark",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <TokenSwatchCard />
        <ActionIconStrip />
        <EnvVarsCard />

        <TypographyCard />
        <FormCard />
        <TrafficChartCard />

        <CodespacesTabsCard />
        <GradientPaginatorCard />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 1 — Token swatches + theme caption                                  */
/* ------------------------------------------------------------------------- */

function TokenSwatchCard() {
  const semantic = [
    { name: "-background", token: "bg-background" },
    { name: "-foreground", token: "bg-foreground" },
    { name: "-primary", token: "bg-primary" },
    { name: "-secondary", token: "bg-secondary" },
    { name: "-muted", token: "bg-muted" },
    { name: "-accent", token: "bg-accent" },
  ];
  const charts = [
    { name: "-border", token: "bg-border" },
    { name: "-chart-1", token: "bg-chart-1" },
    { name: "-chart-2", token: "bg-chart-2" },
    { name: "-chart-3", token: "bg-chart-3" },
    { name: "-chart-4", token: "bg-chart-4" },
    { name: "-chart-5", token: "bg-chart-5" },
  ];
  return (
    <Card className="row-span-1">
      <CardHeader>
        <CardTitle className="text-xl">Design-anchor</CardTitle>
        <CardDescription>
          Live token preview. Edits in the panel on the left immediately re-style every component on this board.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2">
          {semantic.map((s) => (
            <SwatchTile key={s.name} {...s} />
          ))}
          {charts.map((s) => (
            <SwatchTile key={s.name} {...s} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SwatchTile({ name, token }: { name: string; token: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("h-14 w-full rounded-md border border-border", token)} />
      <span className="truncate font-mono text-[10px] text-muted-foreground">{name}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 2 — Action icon strip                                               */
/* ------------------------------------------------------------------------- */

function ActionIconStrip() {
  const top = [Copy, Bell, Trash2, Upload, Download, Settings2];
  const bottom = [RefreshCw, Search, Filter, Share2, Edit3, Plus];
  return (
    <Card>
      <CardContent className="grid grid-cols-6 gap-1.5 pt-6">
        {top.map((Icon, i) => (
          <Button key={i} variant="ghost" size="icon" className="h-10 w-10">
            <Icon size={16} />
          </Button>
        ))}
        {bottom.map((Icon, i) => (
          <Button key={i} variant="ghost" size="icon" className="h-10 w-10">
            <Icon size={16} />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 3 — Environment Variables                                           */
/* ------------------------------------------------------------------------- */

function EnvVarsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>Production · 3 variables</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <EnvRow name="DATABASE_URL" value="••••••••" />
        <EnvRow name="NEXT_PUBLIC_API" value="https://api.example.com" />
        <EnvRow name="STRIPE_SECRET" value="••••••••" />
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" size="sm">Edit</Button>
        <Button size="sm">Deploy</Button>
      </CardFooter>
    </Card>
  );
}

function EnvRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5">
      <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">{name}</span>
      <span className="ml-auto truncate font-mono text-[11px] text-foreground" title={value}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 4 — Typography                                                      */
/* ------------------------------------------------------------------------- */

function TypographyCard() {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-[10px] uppercase tracking-wider">Inherit · Inter</CardDescription>
        <CardTitle className="text-2xl leading-tight">
          Designing with rhythm and hierarchy.
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          A strong body style keeps long-form content readable and balances the visual weight of headings.
        </p>
        <p>
          Thoughtful spacing and cadence help paragraphs scan quickly without feeling dense.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Heart size={14} className="mr-2" /> Share Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 5 — Form / Buttons / Badges                                         */
/* ------------------------------------------------------------------------- */

function FormCard() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <Button variant="ghost" className="px-0 text-sm">Ghost</Button>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
          <div className="min-w-0 text-xs">
            <div className="font-medium text-foreground">Two-factor authentication</div>
            <div className="text-muted-foreground">Verify via email or phone number</div>
          </div>
          <Button size="sm" variant="outline">Enable</Button>
        </div>

        <Slider defaultValue={[58]} max={100} step={1} className="w-full" />

        <Input placeholder="Name" />
        <Textarea placeholder="Message" rows={2} />

        <div className="flex flex-wrap items-center gap-2">
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Checkbox defaultChecked />
          <Checkbox />
          <Checkbox defaultChecked />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Tokens persist after Save & Sync.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm">Button Group</Button>
          <Toggle size="sm">
            <Check size={12} />
          </Toggle>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 6 — Traffic chart (lightweight, no Recharts dependency in preview)  */
/* ------------------------------------------------------------------------- */

const TRAFFIC_DATA = [
  { month: "Jan", desktop: 50, mobile: 110 },
  { month: "Feb", desktop: 58, mobile: 140 },
  { month: "Mar", desktop: 64, mobile: 160 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 80, mobile: 175 },
  { month: "Jun", desktop: 88, mobile: 170 },
];

function TrafficChartCard() {
  const max = 200;
  const [hover, setHover] = React.useState<number | null>(3);
  const active = hover ?? 3;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic channels</CardTitle>
        <CardDescription>
          Monthly desktop and mobile traffic for the last six months — compare volume and mix across periods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative flex h-32 items-end gap-3 pt-6">
          {TRAFFIC_DATA.map((row, i) => {
            const dh = (row.desktop / max) * 100;
            const mh = (row.mobile / max) * 100;
            const isActive = i === active;
            return (
              <button
                type="button"
                key={row.month}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="group relative flex flex-1 flex-col items-stretch justify-end gap-0.5"
              >
                <div
                  className={cn("rounded-sm bg-foreground/15 transition-colors group-hover:bg-foreground/30", isActive && "bg-foreground/40")}
                  style={{ height: `${mh}%` }}
                />
                <div
                  className={cn("rounded-sm bg-primary/40 transition-colors group-hover:bg-primary/70", isActive && "bg-primary")}
                  style={{ height: `${dh}%` }}
                />
                {isActive ? (
                  <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1.5 text-[10px] shadow-md">
                    <div className="font-medium">{row.month}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Desktop {row.desktop}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-foreground/40" /> Mobile {row.mobile}</div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          {TRAFFIC_DATA.map((row) => <span key={row.month}>{row.month}</span>)}
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Desktop</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground/40" /> Mobile</span>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
          <Stat label="Desktop" value="1,224" />
          <Stat label="Mobile" value="860" />
          <Stat label="Mix delta" value="+42%" />
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
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 7 — Codespaces / Local tabs                                         */
/* ------------------------------------------------------------------------- */

function CodespacesTabsCard() {
  return (
    <Card className="md:col-span-1">
      <CardContent className="pt-6">
        <Tabs defaultValue="codespaces">
          <TabsList className="w-full">
            <TabsTrigger value="codespaces" className="flex-1">Codespaces</TabsTrigger>
            <TabsTrigger value="local" className="flex-1">Local</TabsTrigger>
          </TabsList>
          <TabsContent value="codespaces" className="mt-3">
            <div className="flex items-center justify-between border-b border-border py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">Codespaces</div>
                <div className="text-[11px] text-muted-foreground">Your workspaces in the cloud</div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Plus size={14} /></Button>
            </div>
            <div className="space-y-1 pt-2 text-[12px] text-muted-foreground">
              <Row name="design-anchor" hint="main · 2 min ago" />
              <Row name="anchor-portal" hint="feat/customizer · 14 min ago" />
              <Row name="anchor-docs" hint="main · 1 h ago" />
            </div>
          </TabsContent>
          <TabsContent value="local" className="mt-3 text-[12px] text-muted-foreground">
            <Row name="~/Documents/Design-anchor" hint="HEAD · main" />
            <Row name="~/Documents/anchor-portal" hint="HEAD · feat/customizer" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Row({ name, hint }: { name: string; hint: string }) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40">
      <span className="truncate font-mono text-foreground">{name}</span>
      <span className="ml-3 shrink-0 text-[10px] text-muted-foreground/70">{hint}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Card 8 — Gradient + paginator                                            */
/* ------------------------------------------------------------------------- */

function GradientPaginatorCard() {
  return (
    <Card className="relative overflow-hidden border-0 p-0">
      <div
        className="h-48 w-full"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, var(--primary, #6366f1) 0%, color-mix(in oklch, var(--primary, #6366f1) 50%, #000) 60%, var(--background, #0a0a0a) 100%)",
        }}
      />
      <div className="absolute right-4 bottom-4 flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-1 backdrop-blur">
        <button className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-foreground/70 hover:bg-foreground/10">01</button>
        <button className="rounded-full bg-foreground/20 px-2.5 py-0.5 text-[11px] font-medium text-foreground">02</button>
      </div>
    </Card>
  );
}
