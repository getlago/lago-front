import React, { ReactElement, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { configure, render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'

import { initializeTranslations } from './core/apolloClient'
import { theme } from './styles'
import { initializeYup } from './formValidation/initializeYup'

configure({ testIdAttribute: 'data-test' })

export type TestMocksType = MockedResponse<Record<string, unknown>, Record<string, unknown>>[]

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

const AllTheProviders = ({
  children,
  mocks,
}: {
  children: React.ReactNode
  mocks?: TestMocksType
}) => {
  useEffect(() => {
    initializeTranslations()
    initializeYup()
  }, [])

  return (
    <BrowserRouter basename="/">
      <MockedProvider addTypename={false} mocks={mocks}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MockedProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { mocks?: TestMocksType }
) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders {...props} mocks={options?.mocks} />,
    ...options,
  })

export { customRender as render }
