# Product Adoption Guide

Design-anchor is built for teams that want AI-assisted frontend development without accepting design drift as the cost of speed.

It is not only a component library. It is a local governance pipeline that turns product design intent into assets AI tools can read and checks CI can enforce.

## 1. Product Positioning

### One sentence

Design-anchor anchors a product's UI language in tokens, component contracts, AI-readable rules, MCP tools, and audit checks, so long-lived React + Tailwind products stay consistent while teams ship faster with AI.

### Short pitch

AI coding tools are excellent at producing screens. The harder problem is keeping every generated screen inside the same product system after months of edits, multiple contributors, and many AI sessions.

Design-anchor solves that by making design rules executable:

- Tokens define the visual language.
- Component specs define allowed usage.
- Portal makes the system visible and editable.
- Generated rules teach AI agents what to use.
- MCP gives agents structured access to the truth.
- `anchor audit` blocks drift in local checks and CI.

### What category it creates

Design-anchor sits between four familiar categories:

| Existing category | What it usually solves | What Design-anchor adds |
|---|---|---|
| UI kit | Reusable components | Governance over how components are used by humans and AI. |
| Design tokens | Shared visual values | Seed-to-derived pipeline, live Portal editing, Tailwind v4 mapping, and audit enforcement. |
| Design system docs | Human-readable guidance | Machine-readable `spec.json`, generated AI rules, MCP tools, and CI checks. |
| AI coding rules | Prompt-level instruction | Project-local source of truth plus executable verification. |

The core claim: AI-era design systems need to be **readable by humans, callable by agents, and enforceable by CI**.

## 2. Why Long-Lived B2B Products Need It

B2B and enterprise products are usually not judged by a single hero screen. They are judged by daily work:

- Can users scan dense data quickly?
- Do forms, tables, filters, dialogs, and settings behave consistently?
- Can teams add features without creating a new visual dialect every sprint?
- Can a rebrand or density change land without months of cleanup?
- Can AI-generated code be trusted in a regulated or enterprise-grade workflow?

These products accumulate surface area. They also accumulate teams, contractors, experiments, migrations, and AI tools. Without governance, the UI slowly fragments.

Design-anchor is valuable because it turns consistency into infrastructure:

| B2B pressure | Design-anchor response |
|---|---|
| Many repeated patterns | 60+ base components plus specs keep primitives consistent. |
| Frequent roadmap changes | AI agents can generate faster while reading component rules. |
| Long maintenance life | Tokens and specs stay versioned with the repo. |
| Brand and theme updates | Seed changes regenerate derived tokens and re-skin components. |
| Compliance and review needs | `anchor audit` produces concrete file/line diagnostics. |
| Multiple AI tools | Cursor, Claude Code, Copilot, Qoder, and MCP-aware tools read the same rules. |

## 3. Who Should Adopt It

### Product and engineering leaders

Use Design-anchor when frontend speed is increasing through AI, but review quality and UI consistency are becoming harder to control.

The business value is predictable:

- Fewer design regressions.
- Faster onboarding for new contributors.
- Less review time spent on repeated UI corrections.
- Safer AI adoption because rules are enforceable.
- Lower cost for design refreshes and long-term maintenance.

### Design-system teams

Use Design-anchor when your system already has tokens or components, but AI tools do not reliably respect them.

Design-anchor makes the system operational:

- Specs become the source for rules and audit.
- Tokens become editable in a Portal and mapped into Tailwind.
- AI can query the system through MCP instead of relying on memory.

### Frontend teams

Use Design-anchor when engineers spend too much time telling agents "use our Button", "do not hardcode this color", or "match the rest of the app".

Design-anchor moves those reminders into generated files and executable checks.

### Existing products

Design-anchor does not require a full rewrite. A team can start with:

1. `anchor govern` to inject AI rules and audit.
2. `anchor start` to add the Portal and component workbench.
3. Token alignment for brand, radius, spacing, and typography.
4. Incremental migration into `@design` imports.
5. CI audit once the first area is stable.

## 4. Product Capabilities

### 4.1 Token Customizer

The Portal exposes a compact seed surface: primary color, semantic colors, base background/text, font size, radius, spacing unit, and chart colors.

From those seeds, Design-anchor derives 200+ CSS variables. This gives teams a small, understandable editing surface while still producing a full design-token map.

Why it matters:

- Designers can adjust a product theme without touching every component.
- Engineers can review token diffs in Git.
- AI agents can update known token ids instead of inventing new values.

### 4.2 Component Specs

Every component can have a `spec.json` contract that describes:

- Component intent.
- Allowed props and variants.
- Forbidden native tags.
- Baseline token classes.
- Style-lock rules and blacklist patterns.
- AI prompt fragments that explain correct usage.

This is the bridge between design language and machine behavior. The same spec can be rendered in the Portal, synced into AI rule files, and consumed by audit.

### 4.3 AI Rule Generation

Design-anchor generates project-local instructions for multiple tools:

- Cursor rules.
- Claude Code instructions.
- GitHub Copilot instructions.
- Generic `AGENTS.md`.
- MCP configuration.
- Optional hooks.

The value is consistency across tools. A team can switch between Cursor and Claude Code without rewriting the system prompt each time.

### 4.4 MCP Server

The MCP server exposes structured tools for agents:

- List and read components.
- List and update tokens.
- Read and update schemas.
- Run audit.
- Run sync.
- Read generated rules.

This changes AI from "guess from a README" to "query the local design system".

### 4.5 Audit and Governance

`anchor audit` checks for problems like:

- Raw native tags where a governed component exists.
- Arbitrary Tailwind values on color, spacing, radius, and other token-sensitive prefixes.
- Project-specific violations derived from specs.

This is the product's enforcement layer. It turns design governance from a suggestion into a repeatable check.

## 5. Adoption Paths

### Path A: New project

Use this when a team is starting a React + Tailwind product or a new module.

1. Run `npx design-anchor start`.
2. Choose the default kit.
3. Tune tokens in the Portal.
4. Add `@design` imports to product code.
5. Add `anchor audit` to pre-commit or CI.

Outcome: the project starts with tokens, components, AI rules, and governance already connected.

### Path B: Existing product

Use this when a team already has screens and cannot stop feature delivery.

1. Run `anchor govern` to add AI rules first.
2. Run `anchor audit` in report mode to understand drift.
3. Import or map existing components into the Portal.
4. Choose one product area for migration.
5. Gradually replace raw UI with `@design` components.
6. Turn CI enforcement on by scope once violations are under control.

Outcome: governance arrives incrementally instead of demanding a rewrite.

### Path C: Design-system team

Use this when a team owns shared UI assets for multiple product teams.

1. Define the token seed surface.
2. Register base components and specs.
3. Publish rule files and MCP config into consuming repos.
4. Use audit profiles for app, kit, portal, or all scopes.
5. Treat specs as versioned contracts reviewed in PRs.

Outcome: the design system becomes operational in code and AI workflows.

### Path D: AI-heavy prototyping team

Use this when speed matters, but prototypes often become production.

1. Start with the default kit.
2. Let AI generate screens using `@design`.
3. Run audit after each iteration.
4. Promote stable components into specs.
5. Keep token updates explicit, especially when using screenshot references.

Outcome: prototypes remain closer to production quality and need less cleanup.

## 6. Rollout Plan For A B2B Team

### Week 1: Baseline

- Install Design-anchor in the product repo.
- Run audit and capture current drift.
- Identify the top repeated UI surfaces: Button, Input, Select, Dialog, Table, Card, Tabs, Badge, Alert, Form.
- Align `@design` alias and AI rules.

Success signal: AI tools can discover the component list and audit can run locally.

### Week 2: Token alignment

- Tune brand color, surface, text, radius, spacing, and typography seeds.
- Validate light and dark mode.
- Review generated CSS variables.
- Document which tokens are allowed for product work.

Success signal: a brand or density change can be made through tokens, not manual edits.

### Week 3: Component contracts

- Tighten specs for high-traffic components.
- Add forbidden tags and style-lock guidance.
- Teach agents through generated rules.
- Add audit to pre-commit for one stable area.

Success signal: new AI-generated UI uses governed components by default.

### Week 4: CI and expansion

- Add `anchor audit` to CI.
- Expand migration scope by product area.
- Use Portal Govern view to track violations.
- Start reviewing spec changes as part of design-system PRs.

Success signal: UI drift becomes visible, reviewable, and blockable.

## 7. Metrics To Track

Use simple metrics at first:

| Metric | Why it matters |
|---|---|
| Audit violations per PR | Shows whether drift is decreasing. |
| Raw native tag usage | Shows migration from ad hoc UI to governed components. |
| Arbitrary Tailwind values | Shows token discipline. |
| `@design` import coverage | Shows component adoption. |
| Token-only theme changes | Shows whether redesign work is becoming cheaper. |
| Review comments about UI consistency | Shows whether the system reduces human review load. |

## 8. Messaging For Different Audiences

### For executives

Design-anchor reduces the long-term cost of AI-generated frontend work by turning design consistency into an enforceable engineering system.

### For product managers

Teams can ship screens faster without accumulating inconsistent UI debt that slows later feature work.

### For designers

Tokens and component intent become living, editable assets that AI agents and engineers actually use.

### For engineers

The system gives clear imports, rules, and audit diagnostics, so fewer PR comments are spent on repetitive UI corrections.

### For AI users

Agents receive project-local context and can call MCP tools instead of guessing what the design system expects.

## 9. FAQ

### Is this only for big companies?

No. Small teams benefit because they often rely heavily on AI and move quickly. Design-anchor prevents early velocity from becoming future cleanup.

### Is this only for B2B?

No. Any long-lived product benefits. B2B is the clearest fit because dense workflows and repeated patterns make consistency highly visible.

### Does this replace my design system?

Not necessarily. It can be the design system for a new project, or the governance layer around an existing one.

### Does this replace Figma?

No. Figma remains the design canvas. Design-anchor makes the implemented system enforceable in code and visible to AI tools.

### Does AI still make mistakes?

Yes. Design-anchor assumes AI will drift unless it has local context and executable feedback. That is why the product combines rules, MCP, specs, and audit.
