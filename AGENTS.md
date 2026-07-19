# AGENTS.md — GEO.ai

> **Canonical rules for all AI coding agents** (Claude Code, opencode, Cursor, Copilot).
> This is the single source of truth. `CLAUDE.md`, `.cursor/rules/*`, and `opencode.json` all point here.
> Read this before every session. For volatile sprint state, see `ROADMAP.md` (not loaded by default).

---

## 1. Project Context

**GEO.ai** — an AI Visibility & Citation Optimization Platform. Think "Ahrefs for AI Search." Helps websites get discovered, cited, and clicked in the age of ChatGPT, Gemini, Copilot, and Perplexity.

- **Team:** TheTokenziers — Jatin "Ded" (Senior Dev), Harsh (Designer), Suneet/Kysen (Ideator)
- **Context:** Hackathon project (Namaste Dev Hackathon). Building an MVP to validate Generative Engine Optimization (GEO).
- **Stage:** Pre-code. Docs exist; implementation starting.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, API routes, file-based routing |
| Language | TypeScript (strict) | No `any`. Use `unknown` + narrowing |
| Styling | TailwindCSS + CSS variables | Dark-mode-first via variables |
| Database | PostgreSQL | Hosted on Supabase / Railway |
| ORM | Prisma | Type-safe access + migrations |
| Auth | NextAuth.js v5 | Google, GitHub, email |
| AI | OpenAI API | Content optimization, simulation |
| Crawling | Puppeteer / Cheerio | Page analysis, content extraction |
| Charts | Recharts | Declarative charts |
| Icons | Lucide React | Lightweight |
| Email | Resend | Transactional |
| State | RSC + SWR | Minimal client state |
| Testing | Vitest (unit) + Playwright (e2e) | |
| Lint/Format | ESLint + Prettier | |
| CI/CD | GitHub Actions | Lint, test, typecheck |
| Hosting | Vercel | |

**Do not add a dependency without checking for an existing equivalent first, and state why it's needed.**

---

## 3. Project Structure

```
geo-ai/
├── AGENTS.md            # This file — canonical agent rules
├── CLAUDE.md            # Thin pointer → AGENTS.md (Claude Code)
├── ROADMAP.md           # Volatile sprint/roadmap state
├── .cursor/rules/       # Cursor MDC rules → AGENTS.md
├── opencode.json        # opencode config → AGENTS.md
│
├── docs/
│   ├── brain.md         # Core idea, market, business model
│   ├── prd.md           # Product requirements (15 features)
│   ├── design.md        # Design system & UI guidelines
│   ├── brand.md         # Brand voice, colors, typography
│   ├── treemap.md       # Feature hierarchy & dependencies
│   ├── structure.md     # Full file/folder reference
│   └── competitors.md   # Competitive analysis
│
├── prisma/
│   └── schema.prisma
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/                 # App Router
│   │   ├── (marketing)/     # Public pages
│   │   ├── (dashboard)/     # Authenticated pages
│   │   ├── api/             # Route handlers
│   │   ├── layout.tsx
│   │   └── globals.css      # Global styles + CSS variables
│   ├── components/
│   │   ├── ui/              # Primitives (Button, Card, Input, Score)
│   │   ├── layout/          # Sidebar, TopBar, Footer
│   │   ├── dashboard/
│   │   ├── audit/
│   │   └── optimizer/
│   ├── lib/                 # Shared services
│   │   ├── db.ts            # Prisma singleton
│   │   ├── auth.ts          # NextAuth config
│   │   ├── ai.ts            # OpenAI integration
│   │   ├── crawler.ts       # Crawling logic
│   │   └── scoring.ts       # GEO score engine
│   ├── hooks/
│   ├── types/
│   └── utils/
├── tests/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

Full detail: `structure.md`.

---

## 4. Coding Conventions

### TypeScript
- Strict mode: `noImplicitAny`, `strictNullChecks`.
- `interface` for object shapes; `type` for unions/intersections.
- `readonly` for immutability. Never `any` — use `unknown` + type guards.

### React
- Functional components only.
- **Server Components by default.** Add `"use client"` only for interactivity, browser APIs, or hooks.
- Avoid `React.FC`; use explicit prop types. Destructure props in the signature.

### Styling
- TailwindCSS for all styling. No inline styles except dynamic values.
- Theme colors via CSS custom properties in `globals.css` (see `design.md`).
- Use `cn()` (clsx + tailwind-merge) for conditional classes.

### API Routes
- Next.js Route Handlers (`route.ts`).
- Validate every input with Zod.
- Consistent response: `{ success: boolean, data?: T, error?: string }`.
- Correct HTTP status codes.

### Database
- Prisma for all DB ops. No raw SQL unless unavoidable.
- Use `include` / `select` for query optimization.
- Run `npx prisma migrate dev` after schema changes.

### File Naming
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `AuditReport.tsx` |
| Hooks | camelCase, `use` prefix | `useAudit.ts` |
| Utilities | camelCase | `helpers.ts` |
| API routes | kebab-case folders | `api/audit/route.ts` |
| Pages | `page.tsx` | `dashboard/page.tsx` |
| Layouts | `layout.tsx` | `(dashboard)/layout.tsx` |

### Component Pattern
```tsx
import { cn } from "@/utils/helpers"

interface ComponentProps {
  title: string
  variant?: "default" | "compact"
  className?: string
}

export function Component({ title, variant = "default", className }: ComponentProps) {
  return (
    <div className={cn("base-classes", variant === "compact" && "compact-classes", className)}>
      {title}
    </div>
  )
}
```

---

## 5. Workflow Expectations

**Features:** understand the requirement → inspect affected files → identify risks/dependencies → present a short plan → implement incrementally → verify → update docs if needed.

**Bugs:** reproduce → isolate root cause → propose fix → verify → check for regressions.

- Propose a plan before large changes. Prefer incremental edits over rewrites.
- Reuse existing project patterns before introducing new abstractions.
- Don't refactor unrelated code. Don't change architecture without justification.
- When uncertain, ask targeted questions instead of guessing.

---

## 6. Rules

### DO
- Read `docs/brain.md`, `docs/design.md`, and `docs/prd.md` before starting a feature.
- Follow `docs/brand.md` + `docs/design.md` for all UI work.
- Server Components by default; `"use client"` only when required.
- Validate all inputs with Zod.
- Handle loading and error states for every async operation.
- Use meaningful names.

### DON'T
- Never use `any`.
- No new dependency without checking for an existing one + a stated reason.
- No hardcoded secrets — always env vars.
- Don't skip/suppress TypeScript errors — fix them.
- Don't create a new UI component without checking `components/ui/` first.
- No inline styles.
- Never commit `.env.local` or secrets.

---

## 7. Key Commands

```bash
# Dev
npm run dev              # http://localhost:3000

# Build & deploy
npm run build
npm run start

# Database
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate client
npx prisma studio        # DB GUI
npx prisma db push       # Push schema without migration

# Test
npm run test             # Vitest unit
npm run test:e2e         # Playwright e2e

# Quality
npm run lint
npm run lint:fix
npm run format           # Prettier
npm run typecheck        # tsc --noEmit
```

---

## 8. Environment Variables

See `.env.example` for the full list. Required groups:

- **Database:** `DATABASE_URL`
- **Auth:** `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **AI:** `OPENAI_API_KEY`
- **App:** `NEXT_PUBLIC_APP_URL`

Never hardcode these. Never commit real values.

---

## 9. Documentation Map

| File | Read when |
|---|---|
| `docs/brain.md` | Strategy, market, business model |
| `docs/prd.md` | Implementing any feature / scope |
| `docs/design.md` | Building UI |
| `docs/brand.md` | Voice, color, typography |
| `docs/treemap.md` | Feature relationships & priority |
| `docs/structure.md` | Where a new file/route goes |
| `docs/competitors.md` | Positioning, demos, product decisions |
| `ROADMAP.md` | Current sprint & what to build next |
