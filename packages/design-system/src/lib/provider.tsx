import { StyledEngineProvider, ThemeProvider } from '@mui/material'

import { theme } from './muiTheme'

export const DesignSystemProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  )
}
