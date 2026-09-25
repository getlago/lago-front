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
  it('renders one header per category when the backend returns a category split, standalone last', () => {
    const categoryOne = { id: 'cat-1', name: 'Category One', invoiceDisplayName: null }
    const categoryTwo = { id: 'cat-2', name: 'Category Two', invoiceDisplayName: null }
    const rows = [
      buildRow({
        id: 'row-1',
        product: {
          id: 'p-1',
          name: 'Standalone P',
          invoiceDisplayName: null,
          productCategory: null,
        },
      }),
      buildRow({
        id: 'row-2',
        product: {
          id: 'p-2',
          name: 'P Two',
          invoiceDisplayName: null,
          productCategory: categoryOne,
        },
      }),
      buildRow({
        id: 'row-3',
        product: {
          id: 'p-3',
          name: 'P Three',
          invoiceDisplayName: null,
          productCategory: categoryTwo,
        },
      }),
      buildRow({
        id: 'row-4',
        product: {
          id: 'p-4',
          name: 'P Four',
          invoiceDisplayName: null,
          productCategory: categoryOne,
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

    expect(screen.getAllByText('Category One')).toHaveLength(1)

    const orderedLabels = screen
      .getAllByText(
        /^(Category One|Category Two|text_1790284386156njn3ittr9qj|P Two|P Three|P Four|Standalone P)$/,
      )
      .map((element) => element.textContent)

    expect(orderedLabels).toEqual([
      'Category One',
      'P Two',
      'P Four',
      'Category Two',
      'P Three',
      'text_1790284386156njn3ittr9qj',
      'Standalone P',
    ])
  })

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
    expect(screen.getByText('text_1790284386156njn3ittr9qj')).toBeInTheDocument()
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
    await user.click(screen.getByText('text_1790284386156m6phatx4cxa'))

    expect(onCopyRateCardCode).toHaveBeenCalledWith(row)

    await user.click(screen.getByTestId('open-action-button'))
    await user.click(screen.getByText('text_1790284386156k2d8mjjy98f'))

    expect(onRemoveRateCard).toHaveBeenCalledWith(row)
  })
})
