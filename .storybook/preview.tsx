import { ComponentType } from 'react'
import { ThemeProvider } from '@mui/material'

import { useEffect } from 'react'
import { theme } from '~/styles'
import { inputGlobalStyles } from '~/styles/globalStyle'
import { initializeTranslations } from '~/core/apolloClient'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (Story: ComponentType) => {
    useEffect(() => {
      initializeTranslations()
    }, [])

    return (
      <ThemeProvider theme={theme}>
        {inputGlobalStyles}
        <Story />
      </ThemeProvider>
    )
  },
]
