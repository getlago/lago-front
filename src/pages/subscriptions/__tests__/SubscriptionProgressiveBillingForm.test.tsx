import NiceModal from '@ebay/nice-modal-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import { CENTRALIZED_DIALOG_NAME } from '~/components/dialogs/const'
import {
  CurrencyEnum,
  GetSubscriptionForProgressiveBillingFormDocument,
  UpdateSubscriptionProgressiveBillingDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import SubscriptionProgressiveBillingForm, {
  PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_CANCEL_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_CLOSE_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_DISABLED_SWITCH_TEST_ID,
  PROGRESSIVE_BILLING_FORM_TEST_ID,
  PROGRESSIVE_BILLING_HAS_RECURRING_SWITCH_TEST_ID,
  PROGRESSIVE_BILLING_SUBMIT_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_THRESHOLD_AMOUNT_TEST_ID,
} from '../SubscriptionProgressiveBillingForm'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const mockNavigate = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}))

const subscriptionId = 'subscription-1'
const customerId = 'customer-1'
const planId = 'plan-1'

const mockSubscriptionData = {
  id: subscriptionId,
  name: 'Test Subscription',
  progressiveBillingDisabled: false,
  usageThresholds: [
    {
      id: 'threshold-1',
      amountCents: '100',
      recurring: false,
      thresholdDisplayName: 'Threshold 1',
    },
    {
      id: 'threshold-2',
      amountCents: '200',
      recurring: false,
      thresholdDisplayName: 'Threshold 2',
    },
  ],
  plan: {
    id: planId,
    name: 'Test Plan',
    amountCurrency: CurrencyEnum.Usd,
    usageThresholds: [],
  },
}

const createQueryMock = (subscriptionData = mockSubscriptionData): TestMocksType[0] => ({
  request: {
    query: GetSubscriptionForProgressiveBillingFormDocument,
    variables: { subscriptionId },
  },
  result: {
    data: {
      subscription: subscriptionData,
    },
  },
})

const renderComponent = (mocks: TestMocksType = [createQueryMock()]) => {
  return render(<SubscriptionProgressiveBillingForm />, {
    wrapper: (props: { children: React.ReactNode }) => (
      <AllTheProviders
        mocks={mocks}
        useParams={{ subscriptionId, customerId }}
        forceTypenames={false}
      >
        <NiceModal.Provider>{props.children}</NiceModal.Provider>
      </AllTheProviders>
    ),
  })
}

describe('SubscriptionProgressiveBillingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('form rendering', () => {
    it('renders the form container', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_FORM_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders the close button in header', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders the disabled switch after data loads', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_DISABLED_SWITCH_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders the add threshold button when progressive billing is enabled', async () => {
      renderComponent()

      await waitFor(() => {
        expect(
          screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    it('renders the has recurring switch', async () => {
      renderComponent()

      await waitFor(() => {
        expect(
          screen.getByTestId(PROGRESSIVE_BILLING_HAS_RECURRING_SWITCH_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    it('renders cancel and submit buttons', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PROGRESSIVE_BILLING_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('progressive billing disabled toggle', () => {
    it('hides add button and has recurring switch when toggle is clicked', async () => {
      const user = userEvent.setup()

      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_DISABLED_SWITCH_TEST_ID)).toBeInTheDocument()
      })

      // By default, progressive billing is enabled, so these should be visible
      expect(
        screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID),
      ).toBeInTheDocument()
      expect(
        screen.getByTestId(PROGRESSIVE_BILLING_HAS_RECURRING_SWITCH_TEST_ID),
      ).toBeInTheDocument()

      // Toggle to disable
      const disabledSwitch = screen.getByTestId(PROGRESSIVE_BILLING_DISABLED_SWITCH_TEST_ID)

      await user.click(disabledSwitch)

      // After disabling, these should not be visible
      await waitFor(() => {
        expect(
          screen.queryByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(PROGRESSIVE_BILLING_HAS_RECURRING_SWITCH_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('add threshold functionality', () => {
    it('adds a new threshold when clicking add button', async () => {
      const user = userEvent.setup()

      renderComponent()

      await waitFor(() => {
        expect(
          screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })

      const addButton = screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID)

      // Initially there should be 1 row (default threshold)
      await waitFor(() => {
        expect(screen.getByTestId('row-0')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('row-1')).not.toBeInTheDocument()

      await user.click(addButton)

      // After adding, there should be a second row
      await waitFor(() => {
        expect(screen.getByTestId('row-1')).toBeInTheDocument()
      })
    })
  })

  describe('unsaved changes warning', () => {
    it('shows warning dialog when clicking cancel with unsaved changes', async () => {
      const user = userEvent.setup()

      renderComponent()

      await waitFor(() => {
        expect(
          screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })

      // Make a change
      const addButton = screen.getByTestId(PROGRESSIVE_BILLING_ADD_THRESHOLD_BUTTON_TEST_ID)

      await user.click(addButton)

      // Try to cancel
      const cancelButton = screen.getByTestId(PROGRESSIVE_BILLING_CANCEL_BUTTON_TEST_ID)

      await user.click(cancelButton)

      // Warning dialog should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the subscription is billed in a 0-decimal currency', () => {
    describe('WHEN the user enters a threshold amount and submits', () => {
      it('THEN should validate the amount and send it to the mutation', async () => {
        const user = userEvent.setup()
        const jpySubscription = {
          ...mockSubscriptionData,
          usageThresholds: [
            {
              id: 'threshold-1',
              amountCents: '100',
              recurring: false,
              thresholdDisplayName: 'Threshold 1',
            },
          ],
          plan: {
            ...mockSubscriptionData.plan,
            amountCurrency: CurrencyEnum.Jpy,
            applicableUsageThresholds: [],
          },
        }
        const variableMatcher = jest.fn().mockReturnValue(true)
        const updateMock: TestMocksType[0] = {
          request: { query: UpdateSubscriptionProgressiveBillingDocument },
          variableMatcher,
          result: {
            data: {
              updateSubscription: {
                id: subscriptionId,
                progressiveBillingDisabled: false,
                usageThresholds: [
                  {
                    id: 'threshold-1',
                    amountCents: '5000',
                    recurring: false,
                    thresholdDisplayName: 'Threshold 1',
                  },
                ],
              },
            },
          },
        }

        renderComponent([createQueryMock(jpySubscription), updateMock])

        await waitFor(() => {
          expect(
            screen.getByTestId(PROGRESSIVE_BILLING_THRESHOLD_AMOUNT_TEST_ID),
          ).toBeInTheDocument()
        })

        const amountInput = screen
          .getByTestId(PROGRESSIVE_BILLING_THRESHOLD_AMOUNT_TEST_ID)
          .querySelector('input') as HTMLInputElement

        await user.clear(amountInput)
        await user.type(amountInput, '5000')
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_SUBMIT_BUTTON_TEST_ID))

        // A 0-decimal currency makes AmountInput push the `int` formatter. When that
        // emitted a number, `z.object({ amountCents: z.string() })` rejected it and the
        // mutation never fired at all.
        await waitFor(() => {
          expect(variableMatcher).toHaveBeenCalledWith(
            expect.objectContaining({
              input: expect.objectContaining({
                usageThresholds: [expect.objectContaining({ amountCents: 5000 })],
              }),
            }),
          )
        })
      })
    })
  })
})
