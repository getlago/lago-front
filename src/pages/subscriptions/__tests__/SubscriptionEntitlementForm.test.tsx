import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import SubscriptionEntitlementForm, {
  SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_PRIVILEGE_BUTTON_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID,
  SUBSCRIPTION_ENTITLEMENT_FORM_SUBMIT_BUTTON_TEST_ID,
} from '../SubscriptionEntitlementForm'

const PRIVILEGE_VALUE_COMBOBOX_TEST_ID = 'mock-combobox'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => <div data-test={`loading-skeleton-${id}`} />,
}))

const mockCentralizedDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen }),
}))

jest.mock('~/core/utils/domUtils', () => ({
  ...jest.requireActual('~/core/utils/domUtils'),
  scrollToAndClickElement: jest.fn(),
}))

// The MUI autocomplete popper is virtualized and renders no option in jsdom.
// The native select keeps the option list, the disabled flags and the onChange
// wiring real, and drops only the popper.
jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({
    data,
    value,
    error,
    onChange,
    'data-test': dataTest,
  }: {
    data: { value: string; label: string; disabled?: boolean }[]
    value?: string
    error?: boolean
    onChange: (value: string) => void
    'data-test'?: string
  }) => (
    <select
      data-test={dataTest ?? 'mock-combobox'}
      data-error={error ? 'true' : 'false'}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" />
      {data.map(({ value: optionValue, label, disabled }) => (
        <option key={optionValue} value={optionValue} disabled={disabled}>
          {label}
        </option>
      ))}
    </select>
  ),
}))

jest.mock('~/components/form/ComboBox/ComboBoxFieldForTanstack', () => {
  const { useFieldContext } = jest.requireActual<typeof import('~/hooks/forms/formContext')>(
    '~/hooks/forms/formContext',
  )

  return {
    __esModule: true,
    default: function MockComboBoxField({
      data,
      disabled,
      dataTest,
    }: {
      data: { value: string; label: string; disabled?: boolean }[]
      disabled?: boolean
      dataTest?: string
    }) {
      const field = useFieldContext<string | undefined>()

      return (
        <select
          data-test={dataTest}
          name={field.name}
          disabled={disabled}
          value={field.state.value ?? ''}
          onChange={(event) =>
            field.handleChange(event.target.value === '' ? undefined : event.target.value)
          }
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

type MutationHookOptions = { onCompleted: (data: Record<string, { code: string }>) => void }

const mockUseGetSubscriptionDataQuery = jest.fn()
const mockUseGetEntitlementToEditQuery = jest.fn()
const mockCreateOrUpdateEntitlement = jest.fn()
let mutationOptions: MutationHookOptions

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionDataForEntitlementFormQuery: (...args: unknown[]) =>
    mockUseGetSubscriptionDataQuery(...args),
  useGetSubscriptionEntitlementToEditQuery: (...args: unknown[]) =>
    mockUseGetEntitlementToEditQuery(...args),
  useCreateOrUpdateSubscriptionEntitlementMutation: (options: MutationHookOptions) => {
    mutationOptions = options

    return [mockCreateOrUpdateEntitlement]
  },
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const seatsPrivilege = {
  code: 'seats',
  name: 'Seats',
  valueType: PrivilegeValueTypeEnum.Integer,
  config: { selectOptions: null },
}

const tierPrivilege = {
  code: 'tier',
  name: 'Tier',
  valueType: PrivilegeValueTypeEnum.Select,
  config: { selectOptions: ['gold', 'silver'] },
}

const subscriptionData = {
  subscriptionEntitlements: {
    collection: [{ code: 'already_granted', name: 'Already granted', privileges: [] }],
  },
  features: {
    collection: [
      { code: 'feat_a', name: 'Feature A', privileges: [seatsPrivilege, tierPrivilege] },
      { code: 'already_granted', name: 'Already granted', privileges: [] },
    ],
  },
}

const existingEntitlement = {
  code: 'feat_a',
  name: 'Feature A',
  privileges: [{ ...tierPrivilege, value: 'gold' }],
}

const renderPage = async (useParams: Record<string, string> = { subscriptionId: 'sub-1' }) =>
  act(() => render(<SubscriptionEntitlementForm />, { useParams }))

const selectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  value: string,
) => user.selectOptions(element, value)

const selectFeature = async (user: ReturnType<typeof userEvent.setup>, code = 'feat_a') =>
  selectOption(user, screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID), code)

const addPrivilege = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.click(screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
  await selectOption(
    user,
    screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID),
    code,
  )
}

const submit = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_SUBMIT_BUTTON_TEST_ID))

describe('SubscriptionEntitlementForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetSubscriptionDataQuery.mockReturnValue({ data: subscriptionData, loading: false })
    mockUseGetEntitlementToEditQuery.mockReturnValue({ data: undefined, loading: false })
    mockCreateOrUpdateEntitlement.mockResolvedValue({
      data: { createOrUpdateSubscriptionEntitlement: { code: 'feat_a' } },
    })
  })

  describe('GIVEN the entitlement is still loading', () => {
    describe('WHEN rendering the page', () => {
      it('THEN should display the skeleton instead of the fields', async () => {
        mockUseGetEntitlementToEditQuery.mockReturnValue({ data: undefined, loading: true })

        await renderPage({ subscriptionId: 'sub-1', entitlementCode: 'feat_a' })

        expect(screen.getByTestId('loading-skeleton-create-alert')).toBeInTheDocument()
        expect(
          screen.queryByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a new entitlement', () => {
    describe('WHEN rendering the page', () => {
      it.each([
        ['close button', SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID],
        ['cancel button', SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID],
        ['submit button', SUBSCRIPTION_ENTITLEMENT_FORM_SUBMIT_BUTTON_TEST_ID],
        ['feature combobox', SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID],
        ['add privilege button', SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID],
      ])('THEN should display the %s', async (_, testId) => {
        await renderPage()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should leave the feature combobox editable', async () => {
        await renderPage()

        expect(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID),
        ).not.toBeDisabled()
      })

      it('THEN should disable the features already granted on the subscription', async () => {
        await renderPage()

        const options = within(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID),
        ).getAllByRole('option')

        expect(
          options.find((option) => option.getAttribute('value') === 'feat_a'),
        ).not.toBeDisabled()
        expect(
          options.find((option) => option.getAttribute('value') === 'already_granted'),
        ).toBeDisabled()
      })

      it('THEN should keep the add privilege button disabled', async () => {
        await renderPage()

        expect(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID),
        ).toBeDisabled()
      })
    })

    describe('WHEN submitting without a feature', () => {
      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        await renderPage()
        await submit(user)

        await waitFor(() => expect(mockCreateOrUpdateEntitlement).not.toHaveBeenCalled())
      })

      it('THEN should scroll to the first errored input', async () => {
        const user = userEvent.setup()

        await renderPage()
        await submit(user)

        await waitFor(() => expect(scrollToFirstInputError).toHaveBeenCalled())
      })
    })

    describe('WHEN a feature is selected', () => {
      it('THEN should enable the add privilege button', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)

        expect(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID),
        ).not.toBeDisabled()
      })

      it('THEN should submit the feature code with no privilege', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await submit(user)

        await waitFor(() =>
          expect(mockCreateOrUpdateEntitlement).toHaveBeenCalledWith({
            variables: {
              input: {
                subscriptionId: 'sub-1',
                entitlement: { featureCode: 'feat_a', privileges: [] },
              },
            },
          }),
        )
      })
    })

    describe('WHEN a privilege is added', () => {
      it('THEN should display its row with the privilege name', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')

        expect(within(screen.getByTestId('row-0')).getByText('Tier')).toBeInTheDocument()
      })

      it('THEN should disable it in the privilege options', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')
        await user.click(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID),
        )

        const options = within(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID),
        ).getAllByRole('option')

        expect(options.find((option) => option.getAttribute('value') === 'tier')).toBeDisabled()
        expect(
          options.find((option) => option.getAttribute('value') === 'seats'),
        ).not.toBeDisabled()
      })

      it('THEN should not submit while its value is empty', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')
        await submit(user)

        await waitFor(() => expect(mockCreateOrUpdateEntitlement).not.toHaveBeenCalled())
      })

      // Without a visible error the dead submit button is the only feedback the
      // user gets, since the value cell is not a registered form field.
      it('THEN should flag the value cell once the submit revealed the error', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')
        await submit(user)

        await waitFor(() =>
          expect(
            within(screen.getByTestId('row-0')).getByTestId(PRIVILEGE_VALUE_COMBOBOX_TEST_ID),
          ).toHaveAttribute('data-error', 'true'),
        )
      })

      // `scrollToFirstInputError` matches an error key against `input.name`, so an
      // input rendered without one is unreachable however loud its error is.
      it('THEN should leave its errored input reachable by the scroll helper', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'seats')
        await submit(user)

        await waitFor(() => expect(scrollToFirstInputError).toHaveBeenCalled())

        const errorMap = (scrollToFirstInputError as jest.Mock).mock.calls[0][1] as Record<
          string,
          unknown
        >

        const inputs = Array.from(
          document.querySelectorAll(`#${SUBSCRIPTION_ENTITLEMENT_FORM_ID} input`),
        ) as HTMLInputElement[]

        expect(inputs.find((input) => !!errorMap[input.name])?.name).toBe('privileges[0].value')
      })

      it('THEN should submit its code and value once filled', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')
        await selectOption(
          user,
          within(screen.getByTestId('row-0')).getByTestId(PRIVILEGE_VALUE_COMBOBOX_TEST_ID),
          'gold',
        )
        await submit(user)

        await waitFor(() =>
          expect(mockCreateOrUpdateEntitlement).toHaveBeenCalledWith({
            variables: {
              input: {
                subscriptionId: 'sub-1',
                entitlement: {
                  featureCode: 'feat_a',
                  privileges: [{ privilegeCode: 'tier', value: 'gold' }],
                },
              },
            },
          }),
        )
      })
    })

    describe('WHEN a privilege row is deleted', () => {
      it('THEN should remove it from the table', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await addPrivilege(user, 'tier')

        await user.click(within(screen.getByTestId('row-0')).getByRole('button'))

        await waitFor(() => expect(screen.queryByTestId('row-0')).not.toBeInTheDocument())
      })
    })
  })

  describe('GIVEN an existing entitlement', () => {
    beforeEach(() => {
      mockUseGetEntitlementToEditQuery.mockReturnValue({
        data: { subscriptionEntitlement: existingEntitlement },
        loading: false,
      })
    })

    describe('WHEN rendering the page', () => {
      it('THEN should lock the feature combobox on the entitled feature', async () => {
        await renderPage({ subscriptionId: 'sub-1', entitlementCode: 'feat_a' })

        const featureInput = screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID)

        expect(featureInput).toBeDisabled()
        expect(featureInput).toHaveValue('feat_a')
      })

      it('THEN should prefill the privilege row with its saved value', async () => {
        await renderPage({ subscriptionId: 'sub-1', entitlementCode: 'feat_a' })

        expect(
          within(screen.getByTestId('row-0')).getByTestId(PRIVILEGE_VALUE_COMBOBOX_TEST_ID),
        ).toHaveValue('gold')
      })
    })

    describe('WHEN submitting without a change', () => {
      it('THEN should still call the mutation with the saved values', async () => {
        const user = userEvent.setup()

        await renderPage({ subscriptionId: 'sub-1', entitlementCode: 'feat_a' })
        await submit(user)

        await waitFor(() =>
          expect(mockCreateOrUpdateEntitlement).toHaveBeenCalledWith({
            variables: {
              input: {
                subscriptionId: 'sub-1',
                entitlement: {
                  featureCode: 'feat_a',
                  privileges: [{ privilegeCode: 'tier', value: 'gold' }],
                },
              },
            },
          }),
        )
      })
    })
  })

  describe('GIVEN the mutation completed', () => {
    describe('WHEN the response carries a code', () => {
      it('THEN should display a success toast', async () => {
        await renderPage()

        act(() =>
          mutationOptions.onCompleted({
            createOrUpdateSubscriptionEntitlement: { code: 'feat_a' },
          }),
        )

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should navigate back to the customer subscription entitlements tab', async () => {
        await renderPage({ subscriptionId: 'sub-1', customerId: 'cus-1' })

        act(() =>
          mutationOptions.onCompleted({
            createOrUpdateSubscriptionEntitlement: { code: 'feat_a' },
          }),
        )

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          expect.stringContaining('/customer/cus-1/subscription/sub-1'),
        )
      })

      it('THEN should navigate back to the plan subscription entitlements tab', async () => {
        await renderPage({ subscriptionId: 'sub-1', planId: 'plan-1' })

        act(() =>
          mutationOptions.onCompleted({
            createOrUpdateSubscriptionEntitlement: { code: 'feat_a' },
          }),
        )

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          expect.stringContaining('/plan/plan-1/subscription/sub-1'),
        )
      })
    })
  })

  describe('GIVEN a pristine form', () => {
    describe.each([
      ['close button', SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID],
      ['cancel button', SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID],
    ])('WHEN clicking the %s', (_, testId) => {
      it('THEN should leave without warning', async () => {
        const user = userEvent.setup()

        await renderPage({ subscriptionId: 'sub-1', customerId: 'cus-1' })
        await user.click(screen.getByTestId(testId))

        expect(mockCentralizedDialogOpen).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a dirty form', () => {
    describe.each([
      ['close button', SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID],
      ['cancel button', SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID],
    ])('WHEN clicking the %s', (_, testId) => {
      it('THEN should warn before leaving', async () => {
        const user = userEvent.setup()

        await renderPage({ subscriptionId: 'sub-1', customerId: 'cus-1' })
        await selectFeature(user)
        await user.click(screen.getByTestId(testId))

        expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })

      it('THEN should leave once the warning is confirmed', async () => {
        const user = userEvent.setup()

        await renderPage({ subscriptionId: 'sub-1', customerId: 'cus-1' })
        await selectFeature(user)
        await user.click(screen.getByTestId(testId))

        act(() => mockCentralizedDialogOpen.mock.calls[0][0].onAction())

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          expect.stringContaining('/customer/cus-1/subscription/sub-1'),
        )
      })
    })
  })

  describe('GIVEN the privilege picker is open', () => {
    describe('WHEN cancelling it', () => {
      it('THEN should hide the picker and add no privilege', async () => {
        const user = userEvent.setup()

        await renderPage()
        await selectFeature(user)
        await user.click(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID),
        )

        await user.click(
          screen.getByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_PRIVILEGE_BUTTON_TEST_ID),
        )

        expect(
          screen.queryByTestId(SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('row-0')).not.toBeInTheDocument()
      })
    })
  })
})
