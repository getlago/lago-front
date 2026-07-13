import { act, screen } from '@testing-library/react'

import { addToast, removeAllToasts } from '~/core/apolloClient'
import { render } from '~/test-utils'

import { ToastContainer } from '../ToastContainer'

describe('ToastContainer', () => {
  afterEach(() => {
    act(() => removeAllToasts())
  })

  it('renders an added toast with its severity', async () => {
    render(<ToastContainer />)

    act(() => {
      addToast({ severity: 'success', message: 'Product successfully created' })
    })

    expect(await screen.findByText('Product successfully created')).toBeInTheDocument()
    expect(screen.getByTestId('toast/success')).toBeInTheDocument()
  })

  // The container must live inside a router (see App.tsx): Typography turns
  // `<a data-text href>` messages into router Links, which throw outside one.
  it('renders an internal <a data-text> message as a router link', async () => {
    render(<ToastContainer />)

    act(() => {
      addToast({
        severity: 'success',
        message:
          'Product <a data-text="Storage" href="/acme/product-catalog/products/prod-1/overview">-</a> successfully created',
      })
    })

    const link = await screen.findByRole('link', { name: 'Storage' })

    expect(link).toHaveAttribute('href', '/acme/product-catalog/products/prod-1/overview')
  })

  it('deduplicates toasts with an identical message', async () => {
    render(<ToastContainer />)

    act(() => {
      addToast({ severity: 'info', message: 'Same message' })
      addToast({ severity: 'info', message: 'Same message' })
    })

    expect(await screen.findAllByText('Same message')).toHaveLength(1)
  })
})
