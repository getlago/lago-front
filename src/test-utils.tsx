import React, { ReactElement, useEffect } from 'react'
import { configure, render, RenderOptions } from '@testing-library/react'
import { queryHelpers } from '@testing-library/dom'
import { ThemeProvider } from '@mui/material'
import { MockedProvider } from '@apollo/client/testing'

import { initializeTranslations } from './core/apolloClient'
import { theme } from './styles'
import { initializeYup } from './formValidation/initializeYup'

configure({ testIdAttribute: 'data-test' })

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initializeTranslations()
    initializeYup()
  }, [])

  return (
    <MockedProvider addTypename={false}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MockedProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export const queryByDataTest = queryHelpers.queryByAttribute.bind(null, 'data-test')

export { customRender as render }
