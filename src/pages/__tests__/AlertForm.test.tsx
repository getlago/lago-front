import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { AlertTypeEnum, LagoApiError, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import AlertForm, {
  CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID,
  SUBMIT_SUBSCRIPTION_ALERT_TEST_ID,
  SUBSCRIPTION_ALERT_FORM_TEST_ID,
  SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID,
  SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID,
} from '../AlertForm'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// The combobox list is virtualized, so jsdom renders no option. Swap the
// unbound alert type combobox for a native select: the option list, the
// per-option disabled state and the reset-on-change wiring stay real, only the
// MUI popper is out of the picture.
jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({
    data,
    value,
    disabled,
    onChange,
    'data-test': dataTest,
  }: {
    data: { value: string; label: string; disabled?: boolean; labelNode?: React.ReactNode }[]
    value?: string
    disabled?: boolean
    onChange: (value: string) => void
    'data-test'?: string
  }) => (
    <>
      <select
        data-test={dataTest}
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {data.map(({ value: optionValue, label, disabled: optionDisabled }) => (
          <option key={optionValue} value={optionValue} disabled={optionDisabled}>
            {label}
          </option>
        ))}
      </select>
      {/* `<option>` cannot host the rich option row, so the label nodes are rendered
          aside to keep their premium affordance assertable */}
      {data.map(({ value: optionValue, labelNode }) =>
        labelNode ? <div key={`label-node-${optionValue}`}>{labelNode}</div> : null,
      )}
    </>
  ),
}))

// Same virtualization constraint for the billable metric field wrapper
const BILLABLE_METRIC_COMBOBOX_TEST_ID = 'mock-billable-metric-combobox'

jest.mock('~/components/form/ComboBox/ComboBoxFieldForTanstack', () => {
  const { useFieldContext } = jest.requireActual<typeof import('~/hooks/forms/formContext')>(
    '~/hooks/forms/formContext',
  )

  return {
    __esModule: true,
    default: function MockComboBoxField({
      data,
      disabled,
    }: {
      data: { value: string; label: string; disabled?: boolean }[]
      disabled?: boolean
    }) {
      const field = useFieldContext<string | undefined>()

      return (
        <select
          data-test="mock-billable-metric-combobox"
          name={field.name}
          disabled={disabled}
          value={field.state.value ?? ''}
          onChange={(event) => field.handleChange(event.target.value)}
        >
          <option value="" />
          {data.map(({ value, label, disabled: optionDisabled }) => (
            <option key={value} value={value} disabled={optionDisabled}>
              {label}
            </option>
          ))}
        </select>
      )
    },
  }
})

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

const mockOpenPremiumWarningDialog = jest.fn()

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: mockOpenPremiumWarningDialog }),
}))

const mockOrganization: { premiumIntegrations: PremiumIntegrationTypeEnum[] } = {
  premiumIntegrations: [],
}

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: mockOrganization }),
}))

// The thresholds table stays form-library agnostic, so it is stubbed down to
// the two callbacks the form adapter has to honour
const THRESHOLDS_TABLE_TEST_ID = 'mock-alert-thresholds'
const SET_THRESHOLDS_BUTTON = 'mock-set-thresholds'
const SET_THRESHOLD_VALUE_BUTTON = 'mock-set-threshold-value'

jest.mock('~/components/alerts/Thresholds', () => ({
  __esModule: true,
  default: ({
    setThresholds,
    setThresholdValue,
  }: {
    setThresholds: (thresholds: unknown[]) => void
    setThresholdValue: (params: { index: number; key: string; newValue: unknown }) => void
  }) => (
    <div data-test="mock-alert-thresholds">
      <button
        type="button"
        data-test={SET_THRESHOLDS_BUTTON}
        onClick={() => setThresholds([{ code: 'first', recurring: false, value: '10' }])}
      />
      <button
        type="button"
        data-test={SET_THRESHOLD_VALUE_BUTTON}
        onClick={() => setThresholdValue({ index: 0, key: 'value', newValue: '25' })}
      />
    </div>
  ),
  isThresholdValueValid: () => false,
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => (
    <div data-test={`form-loading-skeleton-${id}`} />
  ),
}))

const mockUseGetSubscriptionInfosQuery = jest.fn()
const mockUseGetSubscriptionAlertToEditQuery = jest.fn()
const mockUseGetExistingAlertsOfSubscriptionQuery = jest.fn()
const mockUseGetSubscriptionBillableMetricsQuery = jest.fn()
const mockCreateSubscriptionAlert = jest.fn()
const mockUpdateSubscriptionAlert = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionInfosQuery: (...args: unknown[]) => mockUseGetSubscriptionInfosQuery(...args),
  useGetSubscriptionAlertToEditQuery: (...args: unknown[]) =>
    mockUseGetSubscriptionAlertToEditQuery(...args),
  useGetExistingAlertsOfSubscriptionQuery: (...args: unknown[]) =>
    mockUseGetExistingAlertsOfSubscriptionQuery(...args),
  useGetSubscriptionBillableMetricsQuery: (...args: unknown[]) =>
    mockUseGetSubscriptionBillableMetricsQuery(...args),
  useCreateSubscriptionAlertMutation: () => [mockCreateSubscriptionAlert],
  useUpdateSubscriptionAlertMutation: () => [mockUpdateSubscriptionAlert],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  hasDefinedGQLError: jest.fn(() => false),
}))

const existingAlert = {
  id: 'alert-1',
  alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
  billableMetric: { id: 'bm-1', code: 'bm_code', name: 'BM One' },
  code: 'my-alert',
  name: 'My alert',
  thresholds: [{ code: 'first', recurring: false, value: '12' }],
}

const mockLoadedQueries = ({
  alert,
  existingAlerts = [],
}: {
  alert?: typeof existingAlert
  existingAlerts?: { alertType: AlertTypeEnum; billableMetricId?: string }[]
} = {}) => {
  mockUseGetSubscriptionInfosQuery.mockReturnValue({
    data: {
      subscription: {
        id: 'subscription-1',
        externalId: 'sub-ext-1',
        plan: { id: 'plan-1', amountCurrency: 'USD' },
      },
    },
    loading: false,
  })
  mockUseGetSubscriptionAlertToEditQuery.mockReturnValue({
    data: alert ? { subscriptionAlert: alert } : undefined,
    loading: false,
    error: undefined,
  })
  mockUseGetExistingAlertsOfSubscriptionQuery.mockReturnValue({
    data: {
      subscriptionAlerts: {
        collection: existingAlerts.map(({ alertType, billableMetricId }, index) => ({
          id: `existing-${index}`,
          alertType,
          billableMetricId: billableMetricId ?? null,
        })),
      },
    },
    loading: false,
  })
  mockUseGetSubscriptionBillableMetricsQuery.mockReturnValue({
    data: {
      billableMetrics: {
        collection: [
          { id: 'bm-1', code: 'bm_code', name: 'BM One' },
          { id: 'bm-2', code: 'bm_code_2', name: 'BM Two' },
        ],
      },
    },
    loading: false,
  })
}

const setParams = (params: Record<string, string>) => {
  const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

  useParamsMock.mockReturnValue(params)
}

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const getAlertTypeSelect = () =>
  screen.getByTestId(SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID) as HTMLSelectElement

const getBillableMetricSelect = () =>
  screen.getByTestId(BILLABLE_METRIC_COMBOBOX_TEST_ID) as HTMLSelectElement

const pickAlertType = async (
  user: ReturnType<typeof userEvent.setup>,
  alertType: AlertTypeEnum,
) => {
  await user.selectOptions(getAlertTypeSelect(), alertType)
}

describe('AlertForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateSubscriptionAlert.mockResolvedValue({
      data: { createSubscriptionAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    mockUpdateSubscriptionAlert.mockResolvedValue({
      data: { updateSubscriptionAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    setParams({ subscriptionId: 'subscription-1', customerId: 'customer-1' })
    mockOrganization.premiumIntegrations = []
  })

  describe('GIVEN loading state', () => {
    beforeEach(() => {
      mockUseGetSubscriptionInfosQuery.mockReturnValue({ data: undefined, loading: true })
      mockUseGetSubscriptionAlertToEditQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      })
      mockUseGetExistingAlertsOfSubscriptionQuery.mockReturnValue({
        data: undefined,
        loading: true,
      })
      mockUseGetSubscriptionBillableMetricsQuery.mockReturnValue({
        data: undefined,
        loading: false,
      })
    })

    describe('WHEN queries are loading', () => {
      it('THEN should show loading skeleton', () => {
        render(<AlertForm />)

        expect(screen.getByTestId('form-loading-skeleton-create-alert')).toBeInTheDocument()
      })

      it('THEN should disable the submit button', () => {
        render(<AlertForm />)

        expect(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN create mode', () => {
    describe('WHEN the form is loaded', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should render the form without loading skeleton', () => {
        render(<AlertForm />)

        expect(screen.queryByTestId('form-loading-skeleton-create-alert')).not.toBeInTheDocument()
      })

      it.each([
        ['form', SUBSCRIPTION_ALERT_FORM_TEST_ID],
        ['alert type combobox', SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID],
        ['submit button', SUBMIT_SUBSCRIPTION_ALERT_TEST_ID],
        ['close button', CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        render(<AlertForm />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['name', 'name'],
        ['code', 'code'],
      ])('THEN should display an empty %s input', (_, name) => {
        render(<AlertForm />)

        expect(getInput(name)).toHaveValue('')
      })

      it('THEN should offer every subscription alert type', () => {
        render(<AlertForm />)

        expect(getAlertTypeSelect().querySelectorAll('option[value]:not([value=""])')).toHaveLength(
          5,
        )
      })

      it('THEN should not display the thresholds table until a type is picked', () => {
        render(<AlertForm />)

        expect(screen.queryByTestId(THRESHOLDS_TABLE_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should not display the billable metric combobox until a metric type is picked', () => {
        render(<AlertForm />)

        expect(screen.queryByTestId(BILLABLE_METRIC_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN picking an amount alert type', () => {
      it('THEN should display the thresholds table right away', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)

        expect(screen.getByTestId(THRESHOLDS_TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(BILLABLE_METRIC_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN picking a billable-metric alert type', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should display the billable metric combobox but no thresholds table yet', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageUnits)

        expect(getBillableMetricSelect()).toBeInTheDocument()
        expect(screen.queryByTestId(THRESHOLDS_TABLE_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should display the thresholds table once a metric is picked', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageUnits)
        await user.selectOptions(getBillableMetricSelect(), 'bm-1')

        expect(screen.getByTestId(THRESHOLDS_TABLE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should reset the picked metric when the alert type changes', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageUnits)
        await user.selectOptions(getBillableMetricSelect(), 'bm-1')
        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageAmount)

        expect(getBillableMetricSelect()).toHaveValue('')
        expect(screen.queryByTestId(THRESHOLDS_TABLE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the subscription already has amount alerts', () => {
      it('THEN should disable the taken amount alert types', () => {
        mockLoadedQueries({
          existingAlerts: [
            { alertType: AlertTypeEnum.CurrentUsageAmount },
            { alertType: AlertTypeEnum.LifetimeUsageAmount },
          ],
        })
        render(<AlertForm />)

        const disabledOptions = Array.from(
          getAlertTypeSelect().querySelectorAll('option[disabled]'),
        ).map((option) => option.getAttribute('value'))

        expect(disabledOptions).toEqual([
          AlertTypeEnum.LifetimeUsageAmount,
          AlertTypeEnum.CurrentUsageAmount,
        ])
      })
    })

    describe('WHEN the organization has none of the lifetime usage addons', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it.each([
        ['lifetime usage amount', AlertTypeEnum.LifetimeUsageAmount],
        ['billable metric lifetime usage units', AlertTypeEnum.BillableMetricLifetimeUsageUnits],
      ])('THEN should flag the %s type as premium', (_, alertType) => {
        render(<AlertForm />)

        expect(
          screen.getByTestId(`${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${alertType}`),
        ).toBeInTheDocument()
      })

      it.each([
        ['current usage amount', AlertTypeEnum.CurrentUsageAmount],
        ['billable metric current usage units', AlertTypeEnum.BillableMetricCurrentUsageUnits],
        ['billable metric current usage amount', AlertTypeEnum.BillableMetricCurrentUsageAmount],
      ])('THEN should not flag the %s type as premium', (_, alertType) => {
        render(<AlertForm />)

        expect(
          screen.queryByTestId(`${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${alertType}`),
        ).not.toBeInTheDocument()
      })

      it.each([
        ['lifetime usage amount', AlertTypeEnum.LifetimeUsageAmount],
        ['billable metric lifetime usage units', AlertTypeEnum.BillableMetricLifetimeUsageUnits],
      ])(
        'THEN should open the premium warning dialog instead of picking the %s type',
        async (_, alertType) => {
          const user = userEvent.setup()

          render(<AlertForm />)

          await pickAlertType(user, alertType)

          expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
          expect(getAlertTypeSelect()).toHaveValue('')
          expect(screen.queryByTestId(THRESHOLDS_TABLE_TEST_ID)).not.toBeInTheDocument()
        },
      )

      it('THEN should keep the ungated types selectable', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)

        expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
        expect(getAlertTypeSelect()).toHaveValue(AlertTypeEnum.CurrentUsageAmount)
      })
    })

    describe('WHEN the organization has the granular lifetime usage addon', () => {
      beforeEach(() => {
        mockOrganization.premiumIntegrations = [PremiumIntegrationTypeEnum.GranularLifetimeUsage]
        mockLoadedQueries()
      })

      it('THEN should let the billable metric lifetime usage units type be picked', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        expect(
          screen.queryByTestId(
            `${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${AlertTypeEnum.BillableMetricLifetimeUsageUnits}`,
          ),
        ).not.toBeInTheDocument()

        await pickAlertType(user, AlertTypeEnum.BillableMetricLifetimeUsageUnits)

        expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
        expect(getBillableMetricSelect()).toBeInTheDocument()
      })

      it('THEN should keep the lifetime usage amount type gated', () => {
        render(<AlertForm />)

        expect(
          screen.getByTestId(
            `${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${AlertTypeEnum.LifetimeUsageAmount}`,
          ),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the organization uses lifetime usage', () => {
      it.each([
        PremiumIntegrationTypeEnum.LifetimeUsage,
        PremiumIntegrationTypeEnum.ProgressiveBilling,
      ])(
        'THEN should let the lifetime usage amount type be picked with the %s addon',
        async (addon) => {
          const user = userEvent.setup()

          mockOrganization.premiumIntegrations = [addon]
          mockLoadedQueries()
          render(<AlertForm />)

          expect(
            screen.queryByTestId(
              `${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${AlertTypeEnum.LifetimeUsageAmount}`,
            ),
          ).not.toBeInTheDocument()

          await pickAlertType(user, AlertTypeEnum.LifetimeUsageAmount)

          expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
          expect(getAlertTypeSelect()).toHaveValue(AlertTypeEnum.LifetimeUsageAmount)
          expect(screen.getByTestId(THRESHOLDS_TABLE_TEST_ID)).toBeInTheDocument()
        },
      )
    })

    describe('WHEN a metric already has an alert of the picked type', () => {
      it('THEN should disable that metric row only', async () => {
        const user = userEvent.setup()

        mockLoadedQueries({
          existingAlerts: [
            {
              alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
              billableMetricId: 'bm-1',
            },
          ],
        })
        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageUnits)

        const disabledOptions = Array.from(
          getBillableMetricSelect().querySelectorAll('option[disabled]'),
        ).map((option) => option.getAttribute('value'))

        expect(disabledOptions).toEqual(['bm-1'])
      })

      it('THEN should keep the metric enabled for another alert type', async () => {
        const user = userEvent.setup()

        mockLoadedQueries({
          existingAlerts: [
            {
              alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
              billableMetricId: 'bm-1',
            },
          ],
        })
        render(<AlertForm />)

        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageAmount)

        expect(getBillableMetricSelect().querySelectorAll('option[disabled]')).toHaveLength(0)
      })
    })

    describe('WHEN typing a name', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should derive the code from it', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('name'), 'My alert')

        expect(getInput('code')).toHaveValue('my_alert')
      })

      it('THEN should stop deriving it once the code has been edited', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('code'), 'custom-code')
        await user.tab()
        await user.type(getInput('name'), 'My alert')

        expect(getInput('code')).toHaveValue('custom-code')
      })
    })

    describe('WHEN submitting a valid form', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should create the alert with the serialized thresholds', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                name: '',
                code: 'my-alert',
                alertType: AlertTypeEnum.CurrentUsageAmount,
                subscriptionId: 'subscription-1',
                billableMetricId: undefined,
                thresholds: [{ code: 'first', recurring: false, value: '1000' }],
              },
            },
          })
        })
      })

      it('THEN should carry the picked billable metric in the create input', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.BillableMetricCurrentUsageUnits)
        await user.selectOptions(getBillableMetricSelect(), 'bm-1')
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
                  billableMetricId: 'bm-1',
                  thresholds: [{ code: 'first', recurring: false, value: '10' }],
                }),
              },
            }),
          )
        })
      })

      it('THEN should show a success toast and leave the form', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalled()
      })

      it('THEN should send the value patched on a single threshold cell', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SET_THRESHOLD_VALUE_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  thresholds: [{ code: 'first', recurring: false, value: '2500' }],
                }),
              },
            }),
          )
        })
      })
    })

    describe('WHEN submitting without a required field', () => {
      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<AlertForm />)

        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID)).toBeDisabled()
        })
        expect(mockCreateSubscriptionAlert).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the code already exists', () => {
      it('THEN should keep the user on the form', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        mockCreateSubscriptionAlert.mockResolvedValue({
          data: undefined,
          errors: [{ message: 'ValueAlreadyExist' }],
        })
        ;(hasDefinedGQLError as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueAlreadyExist',
        )

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalled()
        })
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API rejects the submit with a 422 the form does not handle', () => {
      it('THEN should leave the feedback to the global error link and keep the user on the form', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        ;(hasDefinedGQLError as jest.Mock).mockImplementation(() => false)
        mockCreateSubscriptionAlert.mockResolvedValue({
          data: undefined,
          errors: [
            {
              message: 'Unprocessable Entity',
              extensions: {
                code: LagoApiError.UnprocessableEntity,
                details: { value: ['invalid_value'] },
              },
            },
          ],
        })

        render(<AlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.CurrentUsageAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalled()
        })
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN edition mode', () => {
    beforeEach(() => {
      setParams({
        subscriptionId: 'subscription-1',
        customerId: 'customer-1',
        alertId: 'alert-1',
      })
      mockLoadedQueries({ alert: existingAlert })
    })

    describe('WHEN the form is loaded', () => {
      it.each([
        ['name', 'name', 'My alert'],
        ['code', 'code', 'my-alert'],
      ])('THEN should prefill the %s input', async (_, name, expected) => {
        render(<AlertForm />)

        await waitFor(() => {
          expect(getInput(name)).toHaveValue(expected)
        })
      })

      it('THEN should lock the alert type', () => {
        render(<AlertForm />)

        expect(getAlertTypeSelect()).toBeDisabled()
      })

      it('THEN should lock the billable metric and prefill it', () => {
        render(<AlertForm />)

        expect(getBillableMetricSelect()).toBeDisabled()
        expect(getBillableMetricSelect()).toHaveValue('bm-1')
      })

      it('THEN should display the thresholds table', () => {
        render(<AlertForm />)

        expect(screen.getByTestId(THRESHOLDS_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN submitting the form', () => {
      it('THEN should update the alert without the immutable fields', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await waitFor(() => {
          expect(getInput('code')).toHaveValue('my-alert')
        })

        await user.clear(getInput('code'))
        await user.type(getInput('code'), 'renamed-alert')
        await user.click(screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID))

        await waitFor(() => {
          expect(mockUpdateSubscriptionAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'alert-1',
                name: 'My alert',
                code: 'renamed-alert',
                billableMetricId: 'bm-1',
                thresholds: [{ code: 'first', recurring: false, value: '12' }],
              },
            },
          })
        })
      })
    })

    describe('WHEN the alert has been deleted meanwhile', () => {
      it('THEN should notify the user and redirect without a history entry', async () => {
        mockUseGetSubscriptionAlertToEditQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: { message: 'NotFound' },
        })
        ;(hasDefinedGQLError as jest.Mock).mockImplementation((code: string) => code === 'NotFound')

        render(<AlertForm />)

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalledWith(
          expect.stringContaining('subscription-1'),
          expect.objectContaining({ replace: true }),
        )
      })
    })
  })

  describe('GIVEN a dirty form', () => {
    describe('WHEN closing it', () => {
      it('THEN should ask the user to confirm', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<AlertForm />)

        await user.type(getInput('name'), 'My alert')
        await user.click(screen.getByTestId(CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a pristine form', () => {
    describe('WHEN closing it', () => {
      it('THEN should leave without confirmation', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<AlertForm />)

        await user.click(screen.getByTestId(CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID))

        expect(mockDialogOpen).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })
})
