import { fireEvent, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import ProductFilterValuesEditor, {
  buildProductFilterComboBoxData,
  decodeFilterOptionValue,
  ProductFilterValueEntry,
} from '../ProductFilterValuesEditor'

const FILTERS = [
  { id: 'bmf-1', key: 'payment_method', values: ['card', 'cash'] },
  { id: 'bmf-2', key: 'card_location', values: ['domestic', 'international'] },
]

describe('ProductFilterValuesEditor', () => {
  it('renders a chip per selected value with key: value joined by AND', () => {
    const values: ProductFilterValueEntry[] = [
      { billableMetricFilterId: 'bmf-1', value: 'card' },
      { billableMetricFilterId: 'bmf-2', value: 'domestic' },
    ]

    render(
      <ProductFilterValuesEditor
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
    const values: ProductFilterValueEntry[] = [{ billableMetricFilterId: 'bmf-1', value: 'card' }]

    render(
      <ProductFilterValuesEditor
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

  it('renders a parent-key selection (no value) as the bare key', () => {
    const values: ProductFilterValueEntry[] = [
      { billableMetricFilterId: 'bmf-1', value: undefined },
    ]

    render(
      <ProductFilterValuesEditor
        billableMetricFilters={FILTERS}
        values={values}
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByText('payment_method')).toBeInTheDocument()
    expect(screen.queryByText('payment_method: card')).not.toBeInTheDocument()
  })

  // The combobox options are virtualized (they don't render in jsdom), so the
  // parent-key / value option set and the mutual-exclusion disabling are tested
  // directly against the pure builder that feeds the combobox.
  describe('buildProductFilterComboBoxData', () => {
    it('emits a parent-key option (no value) followed by one option per value', () => {
      const data = buildProductFilterComboBoxData([FILTERS[0]], [])

      expect(data.map((option) => option.label)).toEqual([
        'payment_method',
        'payment_method: card',
        'payment_method: cash',
      ])
      // The parent-key option decodes to an entry with an undefined value.
      expect(decodeFilterOptionValue(data[0].value)).toEqual({ id: 'bmf-1' })
      expect(decodeFilterOptionValue(data[1].value)).toEqual({ id: 'bmf-1', value: 'card' })
    })

    it('disables the individual value options once the parent key is selected', () => {
      const data = buildProductFilterComboBoxData(FILTERS, [
        { billableMetricFilterId: 'bmf-1', value: undefined },
      ])

      const byLabel = new Map(data.map((option) => [option.label, option]))

      expect(byLabel.get('payment_method')?.disabled).toBe(false)
      expect(byLabel.get('payment_method: card')?.disabled).toBe(true)
      expect(byLabel.get('payment_method: cash')?.disabled).toBe(true)
      // A different filter's options stay selectable.
      expect(byLabel.get('card_location')?.disabled).toBe(false)
      expect(byLabel.get('card_location: domestic')?.disabled).toBe(false)
    })

    it('disables the parent-key option once one of its values is selected', () => {
      const data = buildProductFilterComboBoxData(FILTERS, [
        { billableMetricFilterId: 'bmf-1', value: 'card' },
      ])

      const byLabel = new Map(data.map((option) => [option.label, option]))

      expect(byLabel.get('payment_method')?.disabled).toBe(true)
      expect(byLabel.get('payment_method: card')?.disabled).toBe(false)
      expect(byLabel.get('payment_method: cash')?.disabled).toBe(false)
    })
  })
})
