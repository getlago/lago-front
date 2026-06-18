import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { QuotePdfHeader } from '../QuotePdfHeader'

describe('QuotePdfHeader', () => {
  it('renders the title and each row', () => {
    render(
      <QuotePdfHeader
        header={{
          documentNumber: 'OF-2026-0012',
          title: 'Order form for Acme Corp',
          rows: ['Order form number OF-2026-0012'],
        }}
      />,
    )

    expect(screen.getByText('Order form for Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Order form number OF-2026-0012')).toBeInTheDocument()
  })

  it('renders one element per row', () => {
    render(
      <QuotePdfHeader
        header={{
          documentNumber: 'OF-1',
          title: 'Order form for Acme',
          rows: ['Line one', 'Line two'],
        }}
      />,
    )

    expect(screen.getByText('Line one')).toBeInTheDocument()
    expect(screen.getByText('Line two')).toBeInTheDocument()
  })
})
