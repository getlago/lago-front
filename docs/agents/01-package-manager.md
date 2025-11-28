## CRITICAL: Package Manager & Workspace

- **ALWAYS use `pnpm` for all package management tasks**
- Use `pnpm install`, `pnpm add`, `pnpm run`, etc.
- Never suggest npm or yarn commands
- The project uses pnpm workspaces with packages in `packages/*`:
  - `packages/configs/` - Shared ESLint, TypeScript, Tailwind configs
  - `packages/design-system/` - Shared UI components and icons
- **Important**: After making changes to workspace packages, run `pnpm install` to trigger postinstall scripts and update the local version
