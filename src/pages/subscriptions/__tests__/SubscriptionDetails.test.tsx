import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CUSTOMER_DETAILS_ROUTE, SUBSCRIPTIONS_ROUTE } from '~/core/router'
import {
  GetSubscriptionForDetailsDocument,
  StatusTypeEnum,
  TerminateCustomerSubscriptionDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import SubscriptionDetails, {
  SUBSCRIPTION_DETAILS_ACTIONS_TEST_ID,
  SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
  SUBSCRIPTION_DETAILS_UPDATE_TEST_ID,
  SUBSCRIPTION_DETAILS_UPGRADE_DOWNGRADE_TEST_ID,
} from '../SubscriptionDetails'

const mockNavigate = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: jest.fn(),
  }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockSubscription = {
  id: 'subscription-1',
  name: 'Test Subscription',
  status: StatusTypeEnum.Active,
  externalId: 'ext-123',
  plan: {
    id: 'plan-1',
    name: 'Test Plan',
    code: 'test-plan',
    payInAdvance: false,
    parent: null,
  },
  customer: {
    id: 'customer-1',
  },
}

const createMocks = (
  subscriptionStatus: StatusTypeEnum = StatusTypeEnum.Active,
  customerDeletedAt?: string | null,
): TestMocksType => [
  {
    request: {
      query: GetSubscriptionForDetailsDocument,
      variables: {
        subscriptionId: 'subscription-1',
      },
    },
    result: {
      data: {
        subscription: {
          ...mockSubscription,
          status: subscriptionStatus,
        },
      },
    },
  },
  ...(customerDeletedAt !== undefined
    ? [
        {
          request: {
            query: TerminateCustomerSubscriptionDocument,
            variables: {
              input: {
                id: 'subscription-1',
                onTerminationInvoice: 'generate',
              },
            },
          },
          result: {
            data: {
              terminateSubscription: {
                id: 'subscription-1',
                status: StatusTypeEnum.Terminated,
                terminatedAt: new Date().toISOString(),
                customer: {
                  id: 'customer-1',
                  deletedAt: customerDeletedAt,
                  activeSubscriptionsCount: 0,
                },
              },
            },
          },
        },
      ]
    : []),
]

const renderSubscriptionDetails = (
  subscriptionStatus: StatusTypeEnum = StatusTypeEnum.Active,
  customerDeletedAt?: string | null,
) => {
  return render(<SubscriptionDetails />, {
    wrapper: (props: { children: React.ReactNode }) => (
      <AllTheProviders
        {...props}
        mocks={createMocks(subscriptionStatus, customerDeletedAt)}
        useParams={{ subscriptionId: 'subscription-1' }}
        forceTypenames={true}
      />
    ),
  })
}

const openPopper = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => {
    expect(screen.getByTestId(SUBSCRIPTION_DETAILS_ACTIONS_TEST_ID)).toBeInTheDocument()
  })

  const actionsButton = screen.getByTestId(SUBSCRIPTION_DETAILS_ACTIONS_TEST_ID)

  await user.click(actionsButton)
}

describe('SubscriptionDetails', () => {
  beforeEach(() => {
    mockHasPermissions.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN user does not have subscriptionsUpdate permission', () => {
    it.each([
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPDATE_TEST_ID,
        buttonName: 'update',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPGRADE_DOWNGRADE_TEST_ID,
        buttonName: 'upgrade/downgrade',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
        buttonName: 'terminate',
      },
    ])('THEN should not render $buttonName button', async ({ buttonTestId }) => {
      const user = userEvent.setup()

      mockHasPermissions.mockReturnValue(false)

      renderSubscriptionDetails(StatusTypeEnum.Active)

      await openPopper(user)

      await waitFor(() => {
        expect(screen.queryByTestId(buttonTestId)).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN subscription is terminated', () => {
    it.each([
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPDATE_TEST_ID,
        buttonName: 'update',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPGRADE_DOWNGRADE_TEST_ID,
        buttonName: 'upgrade/downgrade',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
        buttonName: 'terminate',
      },
    ])('THEN should not render $buttonName button', async ({ buttonTestId }) => {
      const user = userEvent.setup()

      mockHasPermissions.mockReturnValue(true)

      renderSubscriptionDetails(StatusTypeEnum.Terminated)

      await openPopper(user)

      await waitFor(() => {
        expect(screen.queryByTestId(buttonTestId)).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN subscription is canceled', () => {
    it.each([
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPDATE_TEST_ID,
        buttonName: 'update',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_UPGRADE_DOWNGRADE_TEST_ID,
        buttonName: 'upgrade/downgrade',
      },
      {
        buttonTestId: SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
        buttonName: 'terminate',
      },
    ])('THEN should not render $buttonName button', async ({ buttonTestId }) => {
      const user = userEvent.setup()

      mockHasPermissions.mockReturnValue(true)

      renderSubscriptionDetails(StatusTypeEnum.Canceled)

      await openPopper(user)

      await waitFor(() => {
        expect(screen.queryByTestId(buttonTestId)).not.toBeInTheDocument()
      })
    })
  })

  describe('WHEN terminating a subscription', () => {
    describe('WHEN customer is NOT deleted', () => {
      it('THEN should navigate to customer details page', async () => {
        const user = userEvent.setup()

        mockHasPermissions.mockReturnValue(true)

        renderSubscriptionDetails(StatusTypeEnum.Active, null)

        await openPopper(user)

        const terminateButton = screen.getByTestId(SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID)

        await user.click(terminateButton)

        // Wait for dialog to open and click continue
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        const continueButton = screen.getByRole('button', { name: /terminate/i })

        await user.click(continueButton)

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            CUSTOMER_DETAILS_ROUTE.replace(':customerId', 'customer-1'),
          )
        })
      })
    })

    describe('WHEN customer is deleted', () => {
      it('THEN should navigate to subscriptions list', async () => {
        const user = userEvent.setup()

        mockHasPermissions.mockReturnValue(true)

        renderSubscriptionDetails(StatusTypeEnum.Active, '2024-01-01T00:00:00Z')

        await openPopper(user)

        const terminateButton = screen.getByTestId(SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID)

        await user.click(terminateButton)

        // Wait for dialog to open and click continue
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        const continueButton = screen.getByRole('button', { name: /terminate/i })

        await user.click(continueButton)

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(SUBSCRIPTIONS_ROUTE)
        })
      })
    })
  })
})
