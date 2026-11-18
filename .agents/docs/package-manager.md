## CRITICAL: Package Manager & Workspace

- **ALWAYS use `pnpm` for all package management tasks**
- Use `pnpm install`, `pnpm add`, `pnpm run`, etc.
- Never suggest npm or yarn commands
- The project uses pnpm workspaces with packages in `packages/*`:
  - `packages/configs/` - Shared ESLint, TypeScript, Tailwind configs
  - `packages/ui/` (`lago-ui`) — v2 design system, work in progress. Only when a task explicitly
    asks for v2: read `packages/ui/README.md` first (rules, component index, one guide per
    component), import from `lago-ui/<name>`, never `@radix-ui/*` or `lucide-react` directly
- After changing a workspace package's dependencies, run `pnpm install` to relink the workspace
