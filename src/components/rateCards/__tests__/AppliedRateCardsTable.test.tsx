import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { AppliedRateCardsTable } from '../AppliedRateCardsTable'
import { AppliedRateCardRow } from '../types'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const buildRow = (overrides: Partial<AppliedRateCardRow> = {}): AppliedRateCardRow => ({
  id: overrides.id || 'row-1',
  ratePhasesCount: overrides.ratePhasesCount ?? 3,
  product: overrides.product || {
    id: 'product-1',
    name: 'Product One',
    invoiceDisplayName: null,
    productCategory: { id: 'cat-1', name: 'Category One', invoiceDisplayName: null },
  },
  rateCard: overrides.rateCard || {
    id: 'rc-1',
    name: 'Enterprise',
    code: 'enterprise',
    productFilter: null,
  },
})

const noop = () => undefined

describe('AppliedRateCardsTable', () => {
  it('renders a category group header once per category and a standalone group for products without one', () => {
    const rows = [
      buildRow({ id: 'row-1' }),
      buildRow({
        id: 'row-2',
        product: {
          id: 'product-2',
          name: 'Product Two',
          invoiceDisplayName: null,
          productCategory: null,
        },
      }),
    ]

    render(
      <AppliedRateCardsTable
        rows={rows}
        loading={false}
        onPageChange={noop}
        getRateCardHref={() => '/somewhere'}
        onCopyRateCardCode={noop}
        onRemoveRateCard={noop}
      />,
    )

    expect(screen.getByText('Category One')).toBeInTheDocument()
    expect(screen.getByText('text_1790284386156njn3ittr9qj')).toBeInTheDocument()
  })

  it('shows the product filter name, not the product name, when the rate card targets a filter', () => {
    const rows = [
      buildRow({
        product: {
          id: 'product-1',
          name: 'Product One',
          invoiceDisplayName: null,
          productCategory: null,
        },
        rateCard: {
          id: 'rc-1',
          name: 'Enterprise',
          code: 'enterprise',
          productFilter: { id: 'filter-1', name: 'Filter One', invoiceDisplayName: null },
        },
      }),
    ]

    render(
      <AppliedRateCardsTable
        rows={rows}
        loading={false}
        onPageChange={noop}
        getRateCardHref={() => '/somewhere'}
        onCopyRateCardCode={noop}
        onRemoveRateCard={noop}
      />,
    )

    expect(screen.getByText('Filter One')).toBeInTheDocument()
    expect(screen.queryByText('Product One')).not.toBeInTheDocument()
  })

  it('calls onRemoveRateCard and onCopyRateCardCode with the row when the action menu items are used', async () => {
    const user = userEvent.setup()
    const onCopyRateCardCode = jest.fn()
    const onRemoveRateCard = jest.fn()
    const row = buildRow()

    render(
      <AppliedRateCardsTable
        rows={[row]}
        loading={false}
        onPageChange={noop}
        getRateCardHref={() => '/somewhere'}
        onCopyRateCardCode={onCopyRateCardCode}
        onRemoveRateCard={onRemoveRateCard}
      />,
    )

    await user.click(screen.getByTestId('open-action-button'))
    await user.click(screen.getByText('text_1790284386156k2d8mjjy98f'))

    expect(onRemoveRateCard).toHaveBeenCalledWith(row)
  })
})
