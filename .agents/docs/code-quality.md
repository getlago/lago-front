## Code Quality Standards

- Use TypeScript strict mode with proper typing
- Follow ESLint rules from `lago-configs` package
- Write tests for new functionality
- Use existing design system components before creating new ones
- Maintain consistent naming conventions (camelCase for variables, PascalCase for components)
- Use proper error handling with Apollo Client error boundaries

## MUI Imports

Always use direct imports from `@mui/material/*`, never barrel imports:

```typescript
// ✅ Correct
import Button from '@mui/material/Button'
import { type ButtonProps } from '@mui/material/Button'

// ❌ Wrong - triggers full MUI bundle parsing
import { Button } from '@mui/material'
```
