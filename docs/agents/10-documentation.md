## Documentation & Library References

### Using Context7 MCP (If Installed)

If the user has Context7 MCP configured, **ALWAYS use it** to fetch up-to-date documentation for third-party libraries before making assumptions or using outdated knowledge:

1. **When to Use Context7**:
   - When working with React, TypeScript, Vite, Apollo Client, Formik, Yup, Material UI, or any npm package
   - Before implementing features using external libraries
   - When debugging library-specific issues
   - When the user asks questions about library APIs or best practices

2. **How to Use Context7**:
   - First, resolve the library ID: Use `resolve-library-id` with the library name (e.g., "react", "apollo-client", "@mui/material")
   - Then, fetch docs: Use `get-library-docs` with the resolved Context7-compatible library ID
   - Optionally specify a `topic` to focus on specific features (e.g., "hooks", "routing", "forms")

3. **Example Workflow**:

   ```
   User asks: "How do I use Apollo Client mutations?"

   Step 1: resolve-library-id("apollo-client") → /apollographql/apollo-client
   Step 2: get-library-docs("/apollographql/apollo-client", topic: "mutations")
   Step 3: Use the fetched documentation to provide accurate, up-to-date guidance
   ```

4. **Key Libraries in This Project**:
   - React 18: `/facebook/react` or `/facebook/react/v18.x.x`
   - Apollo Client: `/apollographql/apollo-client`
   - Material UI: `/mui/material-ui`
   - Formik: `/jaredpalmer/formik`
   - Vite: `/vitejs/vite`
   - TypeScript: `/microsoft/TypeScript`

**Note**: If Context7 is not installed or not configured, fall back to your training data knowledge, but always prefer Context7 when available for the most accurate and current information.

Always provide solutions that align with Lago's architecture and use pnpm for any package-related operations.

