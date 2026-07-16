import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { InvoiceFormInput, LocalFeeInput } from '~/components/invoices/types'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CurrencyEnum,
  FetchDraftInvoiceTaxesMutation,
  GetAddonListForInfoiceDocument,
  TaxInfosForCreateInvoiceFragment,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID,
  FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID,
  FEES_SECTION_ITEM_ACTIONS_BUTTON_TEST_ID,
  FEES_SECTION_ITEM_TEST_ID,
  FeesSection,
} from '~/pages/createInvoice/components/FeesSection'
import { invoiceFormValidationSchema } from '~/pages/createInvoice/formInitialization/validationSchema'
import { emptyInvoiceFormDefaultValues } from '~/pages/createInvoice/mappers/mapFromApiToForm'
import { render, TestMocksType } from '~/test-utils'

// jsdom measures a 0-height scroll element, so the real virtualizer renders no
// options — render them all instead (same mock as BaseComboBoxVirtualizedList.test.tsx)
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn((config) => {
    const items = Array.from({ length: config.count }, (_, i) => ({
      index: i,
      key: i,
      size: config.estimateSize(i),
      start: Array.from({ length: i }, (__, j) => config.estimateSize(j)).reduce(
        (acc, val) => acc + val,
        0,
      ),
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((acc, item) => acc + item.size, 0),
      scrollToIndex: jest.fn(),
      measureElement: jest.fn(),
    }
  }),
}))

const mockOpenEditInvoiceDisplayNameDialog = jest.fn()
const mockOpenEditFeeBillingPeriodDialog = jest.fn()
const mockOpenEditInvoiceItemDescriptionDialog = jest.fn()
const mockOpenEditInvoiceItemTaxDialog = jest.fn()

jest.mock('~/components/invoices/useEditInvoiceDisplayName', () => ({
  useEditInvoiceDisplayNameDialog: () => ({
    openEditInvoiceDisplayNameDialog: (...args: unknown[]) =>
      mockOpenEditInvoiceDisplayNameDialog(...args),
  }),
}))

jest.mock('~/components/invoices/EditFeeBillingPeriod', () => ({
  useEditFeeBillingPeriodDialog: () => ({
    openEditFeeBillingPeriodDialog: (...args: unknown[]) =>
      mockOpenEditFeeBillingPeriodDialog(...args),
  }),
}))

jest.mock('~/components/invoices/EditInvoiceItemDescriptionDialog', () => ({
  useEditInvoiceItemDescriptionDialog: () => ({
    openEditInvoiceItemDescriptionDialog: (...args: unknown[]) =>
      mockOpenEditInvoiceItemDescriptionDialog(...args),
  }),
}))

jest.mock('~/components/invoices/EditInvoiceItemTaxDialog', () => ({
  useEditInvoiceItemTaxDialog: () => ({
    openEditInvoiceItemTaxDialog: (...args: unknown[]) => mockOpenEditInvoiceItemTaxDialog(...args),
  }),
}))

const addOnsMocks: TestMocksType = [
  {
    request: {
      query: GetAddonListForInfoiceDocument,
      variables: { limit: 20 },
    },
    result: {
      data: {
        addOns: {
          __typename: 'AddOnCollection',
          metadata: { __typename: 'CollectionMetadata', currentPage: 1, totalPages: 1 },
          collection: [
            {
              __typename: 'AddOn',
              id: 'addon_1',
              name: 'Setup fee',
              description: 'Initial setup',
              amountCents: '1000',
              amountCurrency: CurrencyEnum.Eur,
              invoiceDisplayName: '',
              taxes: [],
            },
          ],
        },
      },
    },
  },
]

const vatTax: TaxInfosForCreateInvoiceFragment = {
  id: 'tax_1',
  name: 'VAT',
  code: 'vat_20',
  rate: 20,
}

const baseFee = (overrides: Partial<LocalFeeInput> = {}): LocalFeeInput =>
  ({
    addOnId: 'addon_1',
    name: 'Setup fee',
    description: 'desc',
    invoiceDisplayName: '',
    units: 2,
    unitAmountCents: 10,
    taxes: [vatTax],
    fromDatetime: '2026-07-15T00:00:00.000+02:00',
    toDatetime: '2026-07-15T23:59:59.999+02:00',
    ...overrides,
  }) as LocalFeeInput

// captures the live form so tests can drive submit and assert values
let lastForm:
  | {
      handleSubmit: () => Promise<void>
      state: { values: InvoiceFormInput }
    }
  | undefined

type TestWrapperProps = {
  fees?: LocalFeeInput[]
  hasTaxProvider?: boolean
  customerApplicableTax?: TaxInfosForCreateInvoiceFragment[]
  setTaxProviderTaxesResult?: (
    result: FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes'],
  ) => void
}

const TestWrapper = ({
  fees = [],
  hasTaxProvider = false,
  customerApplicableTax = undefined,
  setTaxProviderTaxesResult = () => undefined,
}: TestWrapperProps) => {
  const defaultValues: InvoiceFormInput = {
    ...emptyInvoiceFormDefaultValues(),
    customerId: 'cus_1',
    currency: CurrencyEnum.Eur,
    fees,
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: invoiceFormValidationSchema },
    onSubmit: async () => {},
  })

  lastForm = form as unknown as typeof lastForm

  return (
    <FeesSection
      form={form}
      hasTaxProvider={hasTaxProvider}
      customerApplicableTax={customerApplicableTax}
      taxProviderTaxesResult={null}
      setTaxProviderTaxesResult={setTaxProviderTaxesResult}
      loading={false}
    />
  )
}

const getRow = (index = 0) => screen.getAllByTestId(FEES_SECTION_ITEM_TEST_ID)[index]

const getUnitsInput = (index = 0) =>
  getRow(index).querySelector(`input[name="fees.${index}.units"]`) as HTMLInputElement

const openRowActions = async (user: ReturnType<typeof userEvent.setup>, index = 0) => {
  await user.click(
    getRow(index).querySelector(
      `[data-test="${FEES_SECTION_ITEM_ACTIONS_BUTTON_TEST_ID}"]`,
    ) as HTMLButtonElement,
  )
}

const findMenuButtonByIcon = (iconTestId: string) => {
  const icon = document.querySelector(`svg[data-test="${iconTestId}"]`) as SVGElement

  return icon?.closest('button') as HTMLButtonElement
}

describe('FeesSection', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no fees', () => {
    describe('WHEN the section renders', () => {
      it('THEN should display the add-item button and no rows', () => {
        render(<TestWrapper />, { mocks: addOnsMocks })

        expect(screen.getByTestId(FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(FEES_SECTION_ITEM_TEST_ID)).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the form is submitted', () => {
      it('THEN should display the at-least-one-item error', async () => {
        render(<TestWrapper />, { mocks: addOnsMocks })

        await act(async () => {
          await lastForm?.handleSubmit()
        })

        expect(screen.getByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user adds an item from the add-on combobox', () => {
    describe('WHEN selecting an add-on', () => {
      it('THEN should append an autofilled fee and close the input', async () => {
        const user = userEvent.setup()
        const applicableTax = [vatTax]
        const { container } = render(<TestWrapper customerApplicableTax={applicableTax} />, {
          mocks: addOnsMocks,
        })

        // the add button auto-clicks the combobox input, which opens the popup
        await user.click(screen.getByTestId(FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID))

        const option = (await screen.findAllByRole('option'))[0]

        await user.click(option)

        await waitFor(() => {
          expect(screen.getAllByTestId(FEES_SECTION_ITEM_TEST_ID)).toHaveLength(1)
        })

        const addedFee = lastForm?.state.values.fees[0]

        expect(addedFee).toEqual(
          expect.objectContaining({
            addOnId: 'addon_1',
            name: 'Setup fee',
            description: 'Initial setup',
            invoiceDisplayName: '',
            units: 1,
            unitAmountCents: 10,
            // no add-on taxes → falls back to the customer applicable tax
            taxes: applicableTax,
          }),
        )
        expect(container.querySelector('.MuiAutocomplete-root')).toBeNull()
      })

      it('THEN should clear the at-least-one-item error', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />, { mocks: addOnsMocks })

        await act(async () => {
          await lastForm?.handleSubmit()
        })

        expect(screen.getByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID))
        await user.click((await screen.findAllByRole('option'))[0])

        await waitFor(() => {
          expect(
            screen.queryByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID),
          ).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN existing fees', () => {
    describe('WHEN the section renders', () => {
      it('THEN should display one row per fee', () => {
        render(<TestWrapper fees={[baseFee(), baseFee({ name: 'Other fee' })]} />, {
          mocks: addOnsMocks,
        })

        expect(screen.getAllByTestId(FEES_SECTION_ITEM_TEST_ID)).toHaveLength(2)
      })

      it('THEN should display the tax rate for a fee with taxes', () => {
        render(<TestWrapper fees={[baseFee({ taxes: [vatTax] })]} />, { mocks: addOnsMocks })

        expect(getRow(0)).toHaveTextContent(
          intlFormatNumber(vatTax.rate / 100, { style: 'percent' }),
        )
      })

      it('THEN should display a 0% tax rate for a fee without taxes', () => {
        render(<TestWrapper fees={[baseFee({ taxes: [] })]} />, { mocks: addOnsMocks })

        expect(getRow(0)).toHaveTextContent('0%')
      })

      it('THEN should display a dash for the tax cell with a tax provider and no fetched result', () => {
        render(<TestWrapper fees={[baseFee()]} hasTaxProvider />, { mocks: addOnsMocks })

        expect(getRow(0)).toHaveTextContent('-')
      })
    })

    describe('WHEN editing the units input', () => {
      it('THEN should write the units as a number in the form values', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee()]} />, { mocks: addOnsMocks })

        const input = getUnitsInput()

        await user.clear(input)
        await user.type(input, '3')

        expect(lastForm?.state.values.fees[0].units).toBe(3)
      })

      it('THEN should write 0 when the input is emptied', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee()]} />, { mocks: addOnsMocks })

        await user.clear(getUnitsInput())

        expect(lastForm?.state.values.fees[0].units).toBe(0)
      })

      it('THEN should clear the tax-provider result when the customer has a tax provider', async () => {
        const user = userEvent.setup()
        const setTaxProviderTaxesResult = jest.fn()

        render(
          <TestWrapper
            fees={[baseFee()]}
            hasTaxProvider
            setTaxProviderTaxesResult={setTaxProviderTaxesResult}
          />,
          { mocks: addOnsMocks },
        )

        await user.clear(getUnitsInput())

        expect(setTaxProviderTaxesResult).toHaveBeenCalledWith(null)
      })
    })

    describe('WHEN submitting a fee with 0 units', () => {
      it('THEN should keep the units error on the form state', async () => {
        render(<TestWrapper fees={[baseFee({ units: 0 })]} />, { mocks: addOnsMocks })

        await act(async () => {
          await lastForm?.handleSubmit()
        })

        const errorMap = (
          lastForm as unknown as {
            state: { errorMap: { onDynamic?: Record<string, unknown> } }
          }
        )?.state.errorMap

        expect(errorMap?.onDynamic?.['fees[0].units']).toBeTruthy()
      })
    })

    describe('WHEN deleting a fee from the row actions', () => {
      it('THEN should remove only that fee from the form values', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee(), baseFee({ name: 'Other fee' })]} />, {
          mocks: addOnsMocks,
        })

        await openRowActions(user, 0)
        await user.click(findMenuButtonByIcon('trash/medium'))

        await waitFor(() => {
          expect(screen.getAllByTestId(FEES_SECTION_ITEM_TEST_ID)).toHaveLength(1)
        })
        expect(lastForm?.state.values.fees).toHaveLength(1)
        expect(lastForm?.state.values.fees[0].name).toBe('Other fee')
      })
    })
  })

  describe('GIVEN the per-fee dialogs', () => {
    describe('WHEN the display-name dialog calls back', () => {
      it('THEN should update the fee invoiceDisplayName', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee()]} />, { mocks: addOnsMocks })

        const penIcon = getRow(0).querySelector('svg[data-test="pen/medium"]') as SVGElement

        await user.click(penIcon.closest('button') as HTMLButtonElement)

        expect(mockOpenEditInvoiceDisplayNameDialog).toHaveBeenCalledTimes(1)

        const { callback } = mockOpenEditInvoiceDisplayNameDialog.mock.calls[0][0]

        act(() => callback('Custom name'))

        expect(lastForm?.state.values.fees[0].invoiceDisplayName).toBe('Custom name')
      })
    })

    describe('WHEN the billing-period dialog calls back', () => {
      it('THEN should update both dates on the right fee in one atomic set', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee(), baseFee({ name: 'Other fee' })]} />, {
          mocks: addOnsMocks,
        })

        await openRowActions(user, 1)
        await user.click(findMenuButtonByIcon('calendar/medium'))

        expect(mockOpenEditFeeBillingPeriodDialog).toHaveBeenCalledTimes(1)

        const { callback } = mockOpenEditFeeBillingPeriodDialog.mock.calls[0][0]

        act(() => callback('2026-08-01T00:00:00.000Z', '2026-08-31T23:59:59.999Z'))

        expect(lastForm?.state.values.fees[1].fromDatetime).toBe('2026-08-01T00:00:00.000Z')
        expect(lastForm?.state.values.fees[1].toDatetime).toBe('2026-08-31T23:59:59.999Z')
        // the other fee is untouched
        expect(lastForm?.state.values.fees[0].fromDatetime).toBe(baseFee().fromDatetime)
      })
    })

    describe('WHEN the description dialog calls back', () => {
      it('THEN should update the fee description', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee()]} />, { mocks: addOnsMocks })

        await openRowActions(user, 0)
        await user.click(findMenuButtonByIcon('text/medium'))

        const { callback } = mockOpenEditInvoiceItemDescriptionDialog.mock.calls[0][0]

        act(() => callback('New description'))

        expect(lastForm?.state.values.fees[0].description).toBe('New description')
      })
    })

    describe('WHEN the taxes dialog calls back', () => {
      it('THEN should update the fee taxes', async () => {
        const user = userEvent.setup()
        const newTaxes = [{ id: 'tax_2', name: 'Eco', code: 'eco_5', rate: 5 }]

        render(<TestWrapper fees={[baseFee()]} />, { mocks: addOnsMocks })

        await openRowActions(user, 0)
        await user.click(findMenuButtonByIcon('percentage/medium'))

        const { callback } = mockOpenEditInvoiceItemTaxDialog.mock.calls[0][0]

        act(() => callback(newTaxes))

        expect(lastForm?.state.values.fees[0].taxes).toEqual(newTaxes)
      })
    })

    describe('WHEN the customer has a tax provider', () => {
      it('THEN should not display the edit-taxes action', async () => {
        const user = userEvent.setup()

        render(<TestWrapper fees={[baseFee()]} hasTaxProvider />, { mocks: addOnsMocks })

        await openRowActions(user, 0)

        expect(document.querySelector('svg[data-test="percentage/medium"]')).toBeNull()
      })
    })
  })
})
