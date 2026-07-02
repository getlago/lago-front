import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import ProductCatalog from '../ProductCatalog'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('ProductCatalog placeholder page', () => {
  it('renders the product catalog view name', () => {
    render(<ProductCatalog />)

    expect(screen.getByText('text_1783019143196z1oi70j03vt')).toBeInTheDocument()
  })
})
