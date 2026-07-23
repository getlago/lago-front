import { fireEvent, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import ProductItemFilterValuesEditor, {
  ProductItemFilterValueEntry,
} from '../ProductItemFilterValuesEditor'

const FILTERS = [
  { id: 'bmf-1', key: 'payment_method', values: ['card', 'cash'] },
  { id: 'bmf-2', key: 'card_location', values: ['domestic', 'international'] },
]

describe('ProductItemFilterValuesEditor', () => {
  it('renders a chip per selected value with key: value joined by AND', () => {
    const values: ProductItemFilterValueEntry[] = [
      { billableMetricFilterId: 'bmf-1', value: 'card' },
      { billableMetricFilterId: 'bmf-2', value: 'domestic' },
    ]

    render(
      <ProductItemFilterValuesEditor
        billableMetricFilters={FILTERS}
        values={values}
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByText('payment_method: card')).toBeInTheDocument()
    expect(screen.getByText('card_location: domestic')).toBeInTheDocument()
  })

  it('calls onChange without a removed value when its chip delete is clicked', () => {
    const onChange = jest.fn()
    const values: ProductItemFilterValueEntry[] = [
      { billableMetricFilterId: 'bmf-1', value: 'card' },
    ]

    render(
      <ProductItemFilterValuesEditor
        billableMetricFilters={FILTERS}
        values={values}
        onChange={onChange}
      />,
    )

    // The design-system Chip's delete affordance is a design-system `Button`
    // (data-test="button"), not an element exposing an accessible name matching
    // /delete/i - the Chip's `deleteIconLabel` tooltip text lands on an
    // intermediate wrapper element instead. Query the actual rendered delete
    // control by its `data-test`, the established pattern in this codebase
    // (see CouponDetailsAppliedCoupons.test.tsx) for design-system Button.
    fireEvent.click(screen.getByTestId('button'))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
