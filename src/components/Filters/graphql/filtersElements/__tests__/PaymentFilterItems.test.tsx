import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ComponentType, useState } from 'react'

import { FiltersProvider } from '~/components/Filters/presentation/context'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import {
  PayablePaymentStatusEnum,
  PayableTypeEnum,
  PaymentTypeEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import { FiltersPanelItemTypeSwitch } from '../../FiltersPanelItemTypeSwitch'
import { useFilters } from '../../useFilters'
import { FiltersItemAmount } from '../FiltersItemAmount'
import { FiltersItemPayablePaymentStatus } from '../FiltersItemPayablePaymentStatus'
import { FiltersItemPayableType } from '../FiltersItemPayableType'
import { FiltersItemPaymentCreatedAt } from '../FiltersItemPaymentCreatedAt'
import { FiltersItemPaymentInvoiceNumber } from '../FiltersItemPaymentInvoiceNumber'
import { FiltersItemPaymentProviderType } from '../FiltersItemPaymentProviderType'
import { FiltersItemPaymentType } from '../FiltersItemPaymentType'
import { FiltersItemReceiptNumber } from '../FiltersItemReceiptNumber'

// jsdom has no layout measurements for the combobox's virtual option list.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        key: index,
        index,
        start: index * 56,
        size: 56,
      })),
    getTotalSize: () => count * 56,
    scrollToIndex: () => {},
    measureElement: () => {},
  }),
}))

type Item = ComponentType<{ value: string | undefined; setFilterValue: (value: string) => void }>

const Harness = ({
  ItemComponent,
  filterType,
}: {
  ItemComponent: Item
  filterType: AvailableFiltersEnum
}) => {
  const [value, setValue] = useState('')
  const { applyFilters } = useFilters()

  return (
    <ItemComponent
      value={value}
      setFilterValue={(next) => {
        setValue(next)
        applyFilters({ filters: [{ filterType, value: next }] })
      }}
    />
  )
}

const renderItem = (ItemComponent: Item, filterType: AvailableFiltersEnum) =>
  render(
    <FiltersProvider availableFilters={[filterType]} filtersNamePrefix="pa">
      <Harness ItemComponent={ItemComponent} filterType={filterType} />
    </FiltersProvider>,
  )

describe('Payment filter items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/payments?page=4')
  })

  afterEach(() => window.history.replaceState({}, '', '/'))

  it.each([
    [
      AvailableFiltersEnum.paymentStatus,
      FiltersItemPayablePaymentStatus,
      PayablePaymentStatusEnum,
      'processing',
      'Processing',
    ],
    [
      AvailableFiltersEnum.paymentProviderType,
      FiltersItemPaymentProviderType,
      ProviderTypeEnum,
      'gocardless',
      'GoCardless',
    ],
    [AvailableFiltersEnum.paymentType, FiltersItemPaymentType, PaymentTypeEnum, 'manual', 'Manual'],
    [
      AvailableFiltersEnum.payableType,
      FiltersItemPayableType,
      PayableTypeEnum,
      'PaymentRequest',
      'Payment request',
    ],
  ] as const)(
    'renders every %s enum option and writes the selected value to its URL parameter',
    async (filterType, ItemComponent, values, selected, label) => {
      renderItem(ItemComponent, filterType)
      fireEvent.mouseDown(screen.getByRole('combobox'))

      const options = await screen.findAllByRole('option')

      expect(options).toHaveLength(Object.values(values).length)
      fireEvent.click(screen.getByRole('option', { name: label }))

      await waitFor(() => expect(testMockNavigateFn).toHaveBeenCalled())
      const search = new URLSearchParams(testMockNavigateFn.mock.lastCall?.[0].search)

      expect(search.get(`pa_${filterType}`)).toBe(selected)
      expect(search.has('page')).toBe(false)
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )

  it.each([
    [AvailableFiltersEnum.receiptNumber, FiltersItemReceiptNumber],
    [AvailableFiltersEnum.invoiceNumber, FiltersItemPaymentInvoiceNumber],
  ] as const)(
    'keeps exact text for %s and limits it to 255 characters',
    async (filterType, ItemComponent) => {
      renderItem(ItemComponent, filterType)
      const input = screen.getByRole('textbox')

      expect(input).toHaveAttribute('maxlength', '255')
      fireEvent.change(input, { target: { value: 'MiXeD-123, & x' } })
      await waitFor(() => expect(testMockNavigateFn).toHaveBeenCalled())
      const search = new URLSearchParams(testMockNavigateFn.mock.lastCall?.[0].search)

      expect(search.get(`pa_${filterType}`)).toBe('MiXeD-123, & x')
    },
  )

  it('keeps every amount digit while editing', () => {
    const setFilterValue = jest.fn()

    render(
      <FiltersItemAmount
        preservePrecision
        value="isEqualTo,90071992547409.92,"
        setFilterValue={setFilterValue}
      />,
    )

    expect(setFilterValue).toHaveBeenLastCalledWith('isEqualTo,90071992547409.92,90071992547409.92')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90071992547409.93' } })
    expect(setFilterValue).toHaveBeenLastCalledWith('isEqualTo,90071992547409.93,90071992547409.93')
  })

  it('uses exact invoice text only in the payments panel', () => {
    render(
      <FiltersProvider
        availableFilters={[AvailableFiltersEnum.invoiceNumber]}
        filtersNamePrefix="pa"
      >
        <FiltersPanelItemTypeSwitch
          filterType={AvailableFiltersEnum.invoiceNumber}
          value="lower-case"
          setFilterValue={jest.fn()}
        />
      </FiltersProvider>,
    )
    expect(screen.getByRole('textbox')).toHaveValue('lower-case')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('renders both payment date boundaries', () => {
    render(<FiltersItemPaymentCreatedAt value="2026-09-01,2026-09-07" setFilterValue={jest.fn()} />)
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })
})
