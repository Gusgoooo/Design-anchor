import * as React from "react";
import { Check, Copy, Filter, Layers, Search, Table2 } from "lucide-react";
import pattern from "../../anchor/patterns/data-table-filters.pattern.json";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  type ColumnDef,
} from "@design";

type PatternRecipe = {
  id: string;
  name: string;
  category: string;
  intent: string;
  bestFor: string[];
  components: string[];
  structure: string[];
  states: string[];
  apply: string[];
  avoid: string[];
  aiPrompt: string;
};

type AccountRow = {
  id: string;
  company: string;
  owner: string;
  plan: string;
  status: "Active" | "Trial" | "Risk";
};

const recipe = pattern as PatternRecipe;

const rows: AccountRow[] = [
  { id: "acme", company: "Acme Finance", owner: "Mina Chen", plan: "Enterprise", status: "Active" },
  { id: "northstar", company: "Northstar Ops", owner: "Eli Park", plan: "Growth", status: "Trial" },
  { id: "vertex", company: "Vertex Cloud", owner: "Rae Stone", plan: "Enterprise", status: "Risk" },
];

const columns: ColumnDef<AccountRow>[] = [
  { id: "company", header: "Company", accessor: (row) => row.company },
  { id: "owner", header: "Owner", accessor: (row) => row.owner },
  { id: "plan", header: "Plan", accessor: (row) => row.plan },
  {
    id: "status",
    header: "Status",
    accessor: (row) => (
      <Badge variant={row.status === "Risk" ? "destructive" : row.status === "Trial" ? "outline" : "secondary"}>
        {row.status}
      </Badge>
    ),
  },
];

const minimalJsx = `import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@design";

export function AccountsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input placeholder="Search accounts" />
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Button>Create account</Button>
        </div>
        <DataTable columns={columns} data={rows} density="compact" />
      </CardContent>
    </Card>
  );
}`;

export function PatternsRoute() {
  const [copied, setCopied] = React.useState<"prompt" | "jsx" | null>(null);

  async function copyText(kind: "prompt" | "jsx", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
        <header className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers size={15} />
              <span>Pattern recipe</span>
              <Badge variant="outline">{recipe.category}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{recipe.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{recipe.intent}</p>
          </div>
          <Button variant="outline" onClick={() => copyText("prompt", recipe.aiPrompt)}>
            {copied === "prompt" ? <Check size={15} /> : <Copy size={15} />}
            Copy AI recipe
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="flex flex-col gap-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Table2 size={16} className="text-muted-foreground" />
                  <CardTitle>Composition Preview</CardTitle>
                </div>
                <CardDescription>Built from existing Design-anchor components; the layout shows assembly, not a finished page template.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input className="pl-8" placeholder="Search accounts" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select defaultValue="all-status">
                      <SelectTrigger className="md:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="risk">Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all-plans">
                      <SelectTrigger className="md:w-40">
                        <SelectValue placeholder="Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-plans">All plans</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline">
                    <Filter size={15} />
                    Filters
                  </Button>
                  <Button>Create account</Button>
                </div>

                <DataTable columns={columns} data={rows} density="compact" variant="plain" getRowKey={(row) => row.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Minimal JSX Shape</CardTitle>
                <CardDescription>The example is intentionally small so AI copies the component composition, not a page style.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => copyText("jsx", minimalJsx)}>
                    {copied === "jsx" ? <Check size={14} /> : <Copy size={14} />}
                    Copy JSX
                  </Button>
                </div>
                <pre className="overflow-auto rounded-md bg-muted p-4 text-sm leading-relaxed text-foreground">
                  <code>{minimalJsx}</code>
                </pre>
              </CardContent>
            </Card>
          </section>

          <aside className="flex flex-col gap-5">
            <RecipeCard title="Use Components" items={recipe.components} badge />
            <RecipeCard title="Structure" items={recipe.structure} />
            <RecipeCard title="States To Cover" items={recipe.states} badge />
            <RecipeCard title="Apply" items={recipe.apply} />
            <RecipeCard title="Avoid" items={recipe.avoid} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({
  title,
  items,
  badge,
}: {
  title: string;
  items: string[];
  badge?: boolean;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {badge ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item, index) => (
              <React.Fragment key={item}>
                {index > 0 ? <Separator /> : null}
                <div className="py-2 text-sm leading-relaxed text-muted-foreground">{item}</div>
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
