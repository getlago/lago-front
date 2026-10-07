import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import {
  AdjustedFeeTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  FixedChargeChargeModelEnum,
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

const mockViewFeeDetailsOpen = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: mockViewFeeDetailsOpen, close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

// Stands in for the real preview row, reduced to the one thing that broke: reaching the
// fee-details drawer through context from inside the drawer body.
jest.mock('../../InvoiceDetailsTableBodyLine', () => {
  const { useViewFeeDetailsDrawer } = jest.requireActual('../../ViewFeeDetailsDrawer')

  return {
    InvoiceDetailsTableBodyLine: ({ fee }: { fee?: { id: string } }) => {
      const viewFeeDetails = useViewFeeDetailsDrawer()

      return (
        <button
          type="button"
          data-test={PREVIEW_ROW_TEST_ID}
          onClick={() => fee && viewFeeDetails.open(fee)}
        >
          preview row
        </button>
      )
    },
  }
})

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
    error,
    'data-test': dataTest,
  }: {
    data: Array<{ value: string; label?: string; disabled?: boolean }>
    onChange: (value: string) => void
    error?: string
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
      {!!error && <span data-test="text-field-error">{error}</span>}
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

const FIXED_CHARGE = {
  id: 'fixed-charge-1',
  invoiceDisplayName: 'Setup fee',
  chargeModel: FixedChargeChargeModelEnum.Standard,
  prorated: false,
}

const SUBSCRIPTION = {
  id: 'sub-1',
  plan: {
    id: 'plan-1',
    charges: [CHARGE_WITHOUT_FILTER, CHARGE_WITH_FILTERS],
    fixedCharges: [FIXED_CHARGE],
  },
} as unknown as SubscriptionForCreateFeeDrawerFragment

const PREVIEW_ROW_TEST_ID = 'edit-fee-drawer-preview-row-stub'

const mockSubmit = jest.fn()

type ContentForm = React.ComponentProps<typeof EditFeeDrawerContent>['form']

let capturedForm: ContentForm | undefined

const SUBMIT_BUTTON_LABEL = 'submit-harness'
const SUBMIT_BUTTON_TEST_ID = 'submit-harness-button'

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

  // BaseDrawer wraps the body and the actions in a form element; the real SubmitButton only
  // submits through one.
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <EditFeeDrawerContent
        form={form}
        invoiceId="invoice-1"
        invoiceSubscriptionId="sub-1"
        isRegenerateMode={isRegenerateMode}
        fee={fee}
        localFees={undefined}
        onSubscriptionLoaded={jest.fn()}
      />
      <form.AppForm>
        <form.SubmitButton dataTest={SUBMIT_BUTTON_TEST_ID}>
          {SUBMIT_BUTTON_LABEL}
        </form.SubmitButton>
      </form.AppForm>
    </form>
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

    describe('WHEN the preview row is clicked', () => {
      // NiceModal mounts the body at the app root, so the page's ViewFeeDetailsDrawerProvider
      // no longer reaches it: without the body providing its own, the row kept its pointer
      // cursor while silently doing nothing.
      it('THEN should open the fee details drawer', async () => {
        const user = userEvent.setup()

        render(<Harness fee={fee} />)
        await user.click(screen.getByTestId(PREVIEW_ROW_TEST_ID))

        expect(mockViewFeeDetailsOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN the drawer was opened from the regenerate flow', () => {
      // That flow has no provider by design, and its preview rows must stay inert.
      it('THEN should leave the preview row inert', async () => {
        const user = userEvent.setup()

        render(<Harness fee={fee} isRegenerateMode />)
        await user.click(screen.getByTestId(PREVIEW_ROW_TEST_ID))

        expect(mockViewFeeDetailsOpen).not.toHaveBeenCalled()
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

  describe('GIVEN the add flow is submitted before anything is selected', () => {
    // The schema rejects `adjustmentType`, but its section is still hidden: without routing the
    // message onto the selector on screen, the real SubmitButton just goes dead unexplained.
    const submitWithNothingSelected = async (
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> => {
      render(<Harness />)

      await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))
    }

    describe('WHEN no charge has been picked', () => {
      it('THEN should show the error on the charge selector', async () => {
        const user = userEvent.setup()

        await submitWithNothingSelected(user)

        await waitFor(() => {
          expect(
            within(screen.getByTestId(EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID)).getByTestId(
              'text-field-error',
            ),
          ).toBeInTheDocument()
        })
      })

      it('THEN should not submit', async () => {
        const user = userEvent.setup()

        await submitWithNothingSelected(user)

        expect(mockSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a charge carrying filters is submitted without a filter', () => {
    const submitWithoutFilter = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
      render(<Harness />)

      await pickOption(
        user,
        EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
        CHARGE_WITH_FILTERS.invoiceDisplayName,
      )
      await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))
    }

    describe('WHEN the filter picker is the only selector left', () => {
      it('THEN should show the error on the filter selector, not the charge one', async () => {
        const user = userEvent.setup()

        await submitWithoutFilter(user)

        await waitFor(() => {
          expect(screen.getByTestId('text-field-error')).toBeInTheDocument()
        })
        expect(
          within(screen.getByTestId(EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID)).queryByTestId(
            'text-field-error',
          ),
        ).not.toBeInTheDocument()
      })

      it('THEN should not submit', async () => {
        const user = userEvent.setup()

        await submitWithoutFilter(user)

        expect(mockSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the add flow is submitted with the adjustment left incomplete', () => {
    const submitIncompleteAdjustment = async (
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> => {
      render(<Harness />)

      await pickOption(
        user,
        EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
        CHARGE_WITHOUT_FILTER.invoiceDisplayName,
      )

      await act(async () => {
        capturedForm?.setFieldValue('adjustmentType', AdjustedFeeTypeEnum.AdjustedAmount)
      })

      await user.click(screen.getByText(SUBMIT_BUTTON_LABEL))
    }

    describe('WHEN the required amounts are empty', () => {
      // Submit-first validation means the button simply stops working on the first attempt;
      // without a visible message there is nothing telling the user which input is missing.
      it('THEN should show an error on each required input', async () => {
        const user = userEvent.setup()

        await submitIncompleteAdjustment(user)

        await waitFor(() => {
          expect(screen.getAllByTestId('text-field-error').length).toBeGreaterThanOrEqual(2)
        })
      })

      it('THEN should not submit', async () => {
        const user = userEvent.setup()

        await submitIncompleteAdjustment(user)

        expect(mockSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN an adjustment was completed for a charge without filters', () => {
    const completeUnfilteredCharge = async (
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> => {
      render(<Harness />)

      await pickOption(
        user,
        EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
        CHARGE_WITHOUT_FILTER.invoiceDisplayName,
      )

      await act(async () => {
        capturedForm?.setFieldValue('adjustmentType', AdjustedFeeTypeEnum.AdjustedUnits)
        capturedForm?.setFieldValue('units', '5')
      })
    }

    describe('WHEN the charge is switched to one carrying filters', () => {
      // The adjustment controls hide behind the filter picker, so an adjustment left valid
      // underneath would submit the new charge with no filter chosen at all.
      it('THEN should drop the adjustment entered for the previous charge', async () => {
        const user = userEvent.setup()

        await completeUnfilteredCharge(user)
        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          CHARGE_WITH_FILTERS.invoiceDisplayName,
        )

        expect(capturedForm?.state.values.adjustmentType).toBeUndefined()
        expect(capturedForm?.state.values.units).toBe('')
        expect(
          screen.queryByTestId(EDIT_FEE_DRAWER_ADJUSTMENT_TYPE_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the very same charge is picked again', () => {
      // Re-selecting is not a change, and wiping the user's entries on it would be its own bug.
      it('THEN should keep the adjustment', async () => {
        const user = userEvent.setup()

        await completeUnfilteredCharge(user)
        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          CHARGE_WITHOUT_FILTER.invoiceDisplayName,
        )

        expect(capturedForm?.state.values.adjustmentType).toBe(AdjustedFeeTypeEnum.AdjustedUnits)
        expect(capturedForm?.state.values.units).toBe('5')
      })
    })
  })

  describe('GIVEN a fixed charge was picked', () => {
    describe('WHEN a usage charge is picked instead', () => {
      // Both ids ride in the same payload, so a leftover fixedChargeId would submit alongside
      // the usage charge the user actually chose.
      it('THEN should keep only the usage charge id', async () => {
        const user = userEvent.setup()

        render(<Harness />)
        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          FIXED_CHARGE.invoiceDisplayName,
        )

        expect(capturedForm?.state.values.fixedChargeId).toBe(FIXED_CHARGE.id)

        await pickOption(
          user,
          EDIT_FEE_DRAWER_CHARGE_COMBOBOX_TEST_ID,
          CHARGE_WITHOUT_FILTER.invoiceDisplayName,
        )

        expect(capturedForm?.state.values.chargeId).toBe(CHARGE_WITHOUT_FILTER.id)
        expect(capturedForm?.state.values.fixedChargeId).toBe('')
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
