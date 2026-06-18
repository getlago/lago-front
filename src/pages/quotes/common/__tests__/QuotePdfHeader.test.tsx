import { renderToStaticMarkup } from 'react-dom/server'

import { QuotePdfHeader } from '../QuotePdfHeader'

describe('QuotePdfHeader', () => {
  it('renders the document number and rows with their BEM classes', () => {
    const html = renderToStaticMarkup(
      <QuotePdfHeader
        header={{
          documentNumber: 'OF-2026-0012',
          rows: [
            { label: 'Customer', value: 'Acme Corp' },
            { label: 'Date', value: 'Apr 10, 2026' },
          ],
        }}
      />,
    )

    expect(html).toContain('class="quote-pdf-header"')
    expect(html).toContain('class="quote-pdf-header__number"')
    expect(html).toContain('class="quote-pdf-header__row"')
    expect(html).toContain('class="quote-pdf-header__label"')
    expect(html).toContain('class="quote-pdf-header__value"')
    expect(html).toContain('OF-2026-0012')
    expect(html).toContain('Customer')
    expect(html).toContain('Acme Corp')
    expect(html).toContain('Date')
    expect(html).toContain('Apr 10, 2026')
  })

  it('escapes HTML in backend-sourced values', () => {
    const html = renderToStaticMarkup(
      <QuotePdfHeader
        header={{
          documentNumber: 'OF-1',
          rows: [{ label: 'Customer', value: 'Acme & Co <script>' }],
        }}
      />,
    )

    expect(html).toContain('Acme &amp; Co &lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
