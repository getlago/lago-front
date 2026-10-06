import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import {
  AdjustedFeeTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  SubscriptionForCreateFeeDrawerFragment,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID,
  EDIT_FEE_DRAWER_LOADING_TEST_ID,
} from '../../invoiceDetailsTestIds'
import { EditFeeDrawerContent } from '../EditFeeDrawerContent'
import { EDIT_FEE_DEFAULT_VALUES, editFeeValidationSchema } from '../validationSchema'

const mockQueryResult = {
  current: { loading: false, data: undefined as unknown },
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceDetailsForCreateFeeDrawerQuery: () => mockQueryResult.current,
}))

// Both pull in the drawer stack, whose `import.meta` jest cannot parse. Neither takes part in
// the form behaviour under test.
jest.mock('../../InvoiceDetailsTable', () => ({
  InvoiceTableSection: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('../../InvoiceDetailsTableBodyLine', () => ({
  InvoiceDetailsTableBodyLine: () => null,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

// The real ComboBox renders its options through a virtualized list, which measures to zero in
// jsdom: the options never reach the DOM. The stub keeps the `onChange` contract the two raw
// comboboxes are wired on.
jest.mock('~/components/form', () => ({
  ...jest.requireActual('~/components/form'),
  ComboBox: ({
    data,
    onChange,
    'data-test': dataTest,
  }: {
    data: Array<{ value: string; label?: string; disabled?: boolean }>
    onChange: (value: string) => void
    'data-test'?: string
  }) => (
    <div data-test={dataTest}>
      {data.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}))

const CHARGE_WITHOUT_FILTER = {
  id: 'charge-no-filter',
  invoiceDisplayName: 'Storage',
  chargeModel: ChargeModelEnum.Standard,
  prorated: false,
  filters: [],
}

const CHARGE_WITH_FILTERS = {
  id: 'charge-with-filters',
  invoiceDisplayName: 'Bandwidth',
  chargeModel: ChargeModelEnum.Standard,
  prorated: false,
  filters: [{ id: 'filter-1', invoiceDisplayName: 'Europe', values: {} }],
}

const SUBSCRIPTION = {
  id: 'sub-1',
  plan: {
    id: 'plan-1',
    charges: [CHARGE_WITHOUT_FILTER, CHARGE_WITH_FILTERS],
    fixedCharges: [],
  },
} as unknown as SubscriptionForCreateFeeDrawerFragment

const mockSubmit = jest.fn()

type ContentForm = React.ComponentProps<typeof EditFeeDrawerContent>['form']

let capturedForm: ContentForm | undefined

const SUBMIT_BUTTON_LABEL = 'submit-harness'

type HarnessProps = {
  fee?: TExtendedRemainingFee
  isRegenerateMode?: boolean
}

const Harness = ({ fee, isRegenerateMode = false }: HarnessProps) => {
  const form = useAppForm({
    defaultValues: EDIT_FEE_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: editFeeValidationSchema },
    onSubmit: ({ value }) => {
      mockSubmit(value)
    },
  })

  capturedForm = form as ContentForm

  return (
    <>
      <EditFeeDrawerContent
        form={form}
        invoiceId="invoice-1"
        invoiceSubscriptionId="sub-1"
        isRegenerateMode={isRegenerateMode}
        fee={fee}
        localFees={undefined}
        onSubscriptionLoaded={jest.fn()}
      />
      <button type="button" onClick={() => form.handleSubmit()}>
        {SUBMIT_BUTTON_LABEL}
      </button>
    </>
  )
}

const pickOption = async (
  user: ReturnType<typeof userEvent.setup>,
  testId: string,
  label: string,
): Promise<void> => {
  await user.click(within(screen.getByTestId(testId)).getByText(label))
}

describe('EditFeeDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedForm = undefined
    mockQueryResult.current = {
      loading: false,
      data: { invoice: { id: 'invoice-1', subscriptions: [SUBSCRIPTION], fees: [] } },
    }
  })

  describe('GIVEN the invoice is still loading on an added fee', () => {
    describe('WHEN the body renders', () => {
      it('THEN should display the loading skeleton instead of the charge picker', () => {
        mockQueryResult.current = { loading: true, data: undefined }

        render(<Harness />)

        expect(screen.getByTestId(EDIT_FEE_DRAWER_LOADING_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the drawer is opened on an existing fee', () => {
    const fee = {
      id: 'fee-1',
      currency: CurrencyEnum.Usd,
      itemName: 'Premium plan',
    } as TExtendedRemainingFee

    describe('WHEN the body renders', () => {
      it('THEN should skip the charge picker, since the fee already names the charge', () => {
        render(<Harness fee={fee} />)

        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should display the adjustment type picker straight away', () => {
        render(<Harness fee={fee} />)

        expect(
          screen.getByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a new fee is being added', () => {
    describe('WHEN no charge has been picked yet', () => {
      it('THEN should display the charge picker alone', () => {
        render(<Harness />)

        expect(screen.getByTestId(EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN a charge without filters is picked', () => {
      it('THEN should move straight on to the adjustment inputs', async () => {
        const user = userEvent.setup()

        render(<Harness />)
        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          CHARGE_WITHOUT_FILTER.invoiceDisplayName,
        )

        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          await screen.findByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN a charge carrying filters is picked', () => {
      it('THEN should ask for a filter before showing the adjustment inputs', async () => {
        const user = userEvent.setup()

        render(<Harness />)
        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          CHARGE_WITH_FILTERS.invoiceDisplayName,
        )

        expect(
          await screen.findByTestId(EDIT_FEE_DRAWER_CHARGE_FILTER_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a charge, a filter and an adjustment have been filled in', () => {
    const fillInWholeForm = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
      render(<Harness />)

      await pickOption(
        user,
        EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
        CHARGE_WITH_FILTERS.invoiceDisplayName,
      )
      // The registered `ComboBoxField` wrapper stores the option's own value, which is what
      // setting it here reproduces.
      await act(async () => {
        capturedForm?.setFieldValue('chargeFilterId', CHARGE_WITH_FILTERS.filters[0].id)
      })

      await act(async () => {
        capturedForm?.setFieldValue('adjustmentType', AdjustedFeeTypeEnum.AdjustedUnits)
        capturedForm?.setFieldValue('units', '4')
      })
    }

    describe('WHEN the form is submitted', () => {
      // The whole point of the select-then-submit case: a combobox storing a shape the schema
      // does not accept leaves submit silently disabled, with no error and no request.
      it('THEN should submit the ids the comboboxes stored', async () => {
        const user = userEvent.setup()

        await fillInWholeForm(user)
        await user.click(screen.getByText(SUBMIT_BUTTON_LABEL))

        await waitFor(() => {
          expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              chargeId: CHARGE_WITH_FILTERS.id,
              chargeFilterId: CHARGE_WITH_FILTERS.filters[0].id,
              adjustmentType: AdjustedFeeTypeEnum.AdjustedUnits,
              units: '4',
            }),
          )
        })
      })
    })

    describe('WHEN the filter is cleared again', () => {
      // Clearing the filter hides the adjustment inputs; leaving their values behind would
      // submit an adjustment against a charge whose filter is no longer selected.
      it('THEN should drop the adjustment that was entered for it', async () => {
        const user = userEvent.setup()

        await fillInWholeForm(user)

        await act(async () => {
          capturedForm?.setFieldValue('chargeFilterId', undefined)
        })

        expect(capturedForm?.state.values.adjustmentType).toBeUndefined()
        expect(capturedForm?.state.values.units).toBe('')
        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
