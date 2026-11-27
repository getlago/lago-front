import { useStore } from '@tanstack/react-form'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { ReactNode } from 'react'

import { ComboboxDataGrouped, ComboBoxProps } from '~/components/form/ComboBox/types'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders } from '~/test-utils'

import { EMPTY_SCOPE_ENTRY, ScopeEntryFormValues } from '../scopeEntry'
import {
  SCOPE_ROW_ADD_FILTERS_TEST_ID,
  SCOPE_ROW_ALL_FILTERS_TEST_ID,
  SCOPE_ROW_ERROR_TEST_ID,
  SCOPE_ROW_FILTER_TEST_ID,
  SCOPE_ROW_PRODUCT_TEST_ID,
  SCOPE_ROW_REMOVE_FILTER_TEST_ID,
  SCOPE_ROW_REMOVE_TEST_ID,
  SCOPE_ROW_TYPE_TEST_ID,
  ScopeRow,
  ScopeTypeOption,
} from '../ScopeRow'

jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({ data, disabled, value, onChange, 'data-test': dataTest }: ComboBoxProps) => (
    <select
      data-test={dataTest}
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" />
      {data?.map(({ value: optionValue, label, disabled: optionDisabled }) => (
        <option key={optionValue} value={optionValue} disabled={optionDisabled}>
          {label}
        </option>
      ))}
    </select>
  ),
}))

const TYPE_OPTIONS: ScopeTypeOption[] = [
  { value: 'a', label: 'Type A' },
  { value: 'b', label: 'Type B' },
]

const PRODUCTS: { data: ComboboxDataGrouped[]; renderGroupHeader: Record<string, ReactNode> } = {
  data: [
    { value: 'P1', label: 'Product 1', group: 'g' },
    { value: 'P2', label: 'Product 2', group: 'g' },
  ],
  renderGroupHeader: {},
}

const FILTERS: Record<string, Array<{ value: string; label: string }>> = {
  P1: [
    { value: 'F1', label: 'Filter 1' },
    { value: 'F2', label: 'Filter 2' },
  ],
}

let latestValue: ScopeEntryFormValues | undefined

type HostProps = {
  initial?: ScopeEntryFormValues
  typeOptions?: ScopeTypeOption[]
  products?: typeof PRODUCTS
  disabled?: boolean
  errorMessage?: string
  lockedWithProductFilters?: boolean
  onRemove?: () => void
}

const Host = ({ initial = EMPTY_SCOPE_ENTRY, ...props }: HostProps): JSX.Element => {
  const form = useAppForm({ defaultValues: { scope: initial } })
  const value = useStore(form.store, (state) => state.values.scope)

  latestValue = value

  return (
    <ScopeRow
      form={form}
      fields="scope"
      label="Include"
      typeOptions={TYPE_OPTIONS}
      products={PRODUCTS}
      getFilters={(productCode: string) => FILTERS[productCode] ?? []}
      disabled={false}
      {...props}
    />
  )
}

const renderRow = async (props: HostProps = {}): Promise<void> => {
  await act(async () => {
    render(
      <AllTheProviders>
        <Host {...props} />
      </AllTheProviders>,
    )
  })
}

const getSelect = (testId: string): HTMLSelectElement =>
  screen.getByTestId(testId) as HTMLSelectElement

const getCheckbox = (): HTMLInputElement =>
  within(screen.getByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).getByRole('checkbox')

const change = async (testId: string, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(getSelect(testId), { target: { value } })
  })
}

const click = async (element: HTMLElement): Promise<void> => {
  await act(async () => {
    fireEvent.click(element)
  })
}

describe('ScopeRow', () => {
  beforeEach(() => {
    latestValue = undefined
  })

  describe('GIVEN the type options', () => {
    describe('WHEN a single option is available', () => {
      it('THEN should prefill it and disable the type select', async () => {
        await renderRow({ typeOptions: [{ value: 'a', label: 'Type A' }] })

        expect(latestValue?.type).toBe('a')
        expect(getSelect(SCOPE_ROW_TYPE_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN several options are available', () => {
      it('THEN should leave the type empty and enabled', async () => {
        await renderRow()

        expect(latestValue?.type).toBe('')
        expect(getSelect(SCOPE_ROW_TYPE_TEST_ID)).not.toBeDisabled()
      })
    })

    describe('WHEN every option but one is disabled', () => {
      it('THEN should prefill the available one and disable the type select', async () => {
        await renderRow({
          typeOptions: [
            { value: 'a', label: 'Type A' },
            { value: 'b', label: 'Type B', disabled: true },
          ],
        })

        expect(latestValue?.type).toBe('a')
        expect(getSelect(SCOPE_ROW_TYPE_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the type changes', () => {
      it('THEN should reset the rest of the row', async () => {
        await renderRow({
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: '',
            withProductFilters: true,
          },
        })

        await change(SCOPE_ROW_TYPE_TEST_ID, 'b')

        expect(latestValue).toEqual({
          type: 'b',
          productCode: '',
          productFilterCode: '',
          withProductFilters: false,
        })
      })
    })
  })

  describe('GIVEN the product options', () => {
    describe('WHEN a single product is available', () => {
      it('THEN should prefill it and disable the product select', async () => {
        await renderRow({
          products: {
            data: [
              { value: 'P1', label: 'Product 1', group: 'g' },
              { value: 'P2', label: 'Product 2', group: 'g', disabled: true },
            ],
            renderGroupHeader: {},
          },
        })

        expect(latestValue?.productCode).toBe('P1')
        expect(getSelect(SCOPE_ROW_PRODUCT_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN no filter was added', () => {
    describe('WHEN the row renders', () => {
      it('THEN should show the checkbox line and no filter select', async () => {
        await renderRow()

        expect(screen.getByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_FILTER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN checking "all filters"', () => {
      it('THEN should store it and disable "add filters"', async () => {
        await renderRow({ initial: { ...EMPTY_SCOPE_ENTRY, type: 'a', productCode: 'P1' } })

        await click(getCheckbox())

        expect(latestValue?.withProductFilters).toBe(true)
        expect(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN "add filters" is clicked', () => {
    describe('WHEN picking a filter', () => {
      it('THEN should replace the checkbox line with the filter select and store the filter', async () => {
        await renderRow({ initial: { ...EMPTY_SCOPE_ENTRY, type: 'a', productCode: 'P1' } })

        await click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))

        expect(screen.getByTestId(SCOPE_ROW_FILTER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).not.toBeInTheDocument()

        await change(SCOPE_ROW_FILTER_TEST_ID, 'F1')

        expect(latestValue).toEqual(
          expect.objectContaining({ productFilterCode: 'F1', withProductFilters: false }),
        )
      })
    })

    describe('WHEN no filter is picked yet', () => {
      it('THEN should mark the filter as added in the form value', async () => {
        await renderRow({ initial: { ...EMPTY_SCOPE_ENTRY, type: 'a', productCode: 'P1' } })
        await click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))

        expect(latestValue?.isFilterAdded).toBe(true)
        expect(latestValue?.productFilterCode).toBe('')
      })

      it('THEN should unmark it once the filter line is removed', async () => {
        await renderRow({ initial: { ...EMPTY_SCOPE_ENTRY, type: 'a', productCode: 'P1' } })
        await click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))
        await click(screen.getByTestId(SCOPE_ROW_REMOVE_FILTER_TEST_ID))

        expect(latestValue?.isFilterAdded).toBe(false)
        expect(screen.getByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN removing the filter', () => {
      it('THEN should clear it and restore the checkbox line', async () => {
        await renderRow({
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: 'F1',
            withProductFilters: false,
          },
        })

        await click(screen.getByTestId(SCOPE_ROW_REMOVE_FILTER_TEST_ID))

        expect(latestValue?.productFilterCode).toBe('')
        expect(screen.queryByTestId(SCOPE_ROW_FILTER_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(SCOPE_ROW_ALL_FILTERS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the product changes', () => {
      it('THEN should clear the filter', async () => {
        await renderRow({
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: 'F1',
            withProductFilters: false,
          },
        })

        await change(SCOPE_ROW_PRODUCT_TEST_ID, 'P2')

        expect(latestValue).toEqual(
          expect.objectContaining({ productCode: 'P2', productFilterCode: '' }),
        )
        expect(screen.queryByTestId(SCOPE_ROW_FILTER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN no product is picked', () => {
      it('THEN should list no filter', async () => {
        await renderRow()

        await click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))

        expect(getSelect(SCOPE_ROW_FILTER_TEST_ID).options).toHaveLength(1)
      })
    })
  })

  describe('GIVEN the "all filters" state is locked', () => {
    it.each([
      [true, true],
      [false, false],
    ])(
      'WHEN locked to %s THEN should store it and disable the checkbox',
      async (locked, expected) => {
        await renderRow({
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: '',
            withProductFilters: !locked,
          },
          lockedWithProductFilters: locked,
        })

        expect(latestValue?.withProductFilters).toBe(expected)
        expect(getCheckbox()).toBeDisabled()
      },
    )

    describe('WHEN locked on and "add filters" is clicked', () => {
      it('THEN should allow a filter and turn the checkbox state off', async () => {
        await renderRow({
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: '',
            withProductFilters: true,
          },
          lockedWithProductFilters: true,
        })

        expect(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID)).not.toBeDisabled()

        await click(screen.getByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID))

        expect(latestValue?.withProductFilters).toBe(false)
        expect(screen.getByTestId(SCOPE_ROW_FILTER_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the row options', () => {
    describe('WHEN an error message is given', () => {
      it('THEN should render it in the row', async () => {
        await renderRow({ errorMessage: 'Something is missing' })

        expect(screen.getByTestId(SCOPE_ROW_ERROR_TEST_ID)).toHaveTextContent(
          'Something is missing',
        )
      })
    })

    describe('WHEN onRemove is given', () => {
      it('THEN should call it from the trash button', async () => {
        const onRemove = jest.fn()

        await renderRow({ onRemove })
        await click(screen.getByTestId(SCOPE_ROW_REMOVE_TEST_ID))

        expect(onRemove).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN onRemove is not given', () => {
      it('THEN should render no trash button', async () => {
        await renderRow()

        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the row is disabled', () => {
      it('THEN should disable every control and hide the row actions', async () => {
        await renderRow({
          disabled: true,
          onRemove: jest.fn(),
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: '',
            withProductFilters: true,
          },
        })

        expect(getSelect(SCOPE_ROW_TYPE_TEST_ID)).toBeDisabled()
        expect(getSelect(SCOPE_ROW_PRODUCT_TEST_ID)).toBeDisabled()
        expect(getCheckbox()).toBeDisabled()
        expect(screen.queryByTestId(SCOPE_ROW_ADD_FILTERS_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should show a saved filter disabled, without its trash', async () => {
        await renderRow({
          disabled: true,
          initial: {
            type: 'a',
            productCode: 'P1',
            productFilterCode: 'F1',
            withProductFilters: false,
          },
        })

        expect(getSelect(SCOPE_ROW_FILTER_TEST_ID)).toBeDisabled()
        expect(screen.queryByTestId(SCOPE_ROW_REMOVE_FILTER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
