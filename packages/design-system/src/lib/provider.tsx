import { StyledEngineProvider, ThemeProvider } from '@mui/material'

import { theme } from './muiTheme'

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  )
}
