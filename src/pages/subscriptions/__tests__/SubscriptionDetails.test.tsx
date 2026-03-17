import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { CUSTOMER_DETAILS_ROUTE, SUBSCRIPTIONS_ROUTE } from '~/core/router'
import { StatusTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import SubscriptionDetails, {
  SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
  SUBSCRIPTION_DETAILS_UPDATE_TEST_ID,
  SUBSCRIPTION_DETAILS_UPGRADE_DOWNGRADE_TEST_ID,
} from '../SubscriptionDetails'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => <div data-test="active-tab-content">Tab Content</div>,
}))

const mockHasPermissions = jest.fn().mockReturnValue(true)

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

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockOpenTerminateDialog = jest.fn()

jest.mock('~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog', () => ({
  useTerminateCustomerSubscriptionDialog: () => ({
    openTerminateCustomerSubscriptionDialog: mockOpenTerminateDialog,
  }),
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

const mockUseGetSubscriptionForDetailsQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionForDetailsQuery: () => mockUseGetSubscriptionForDetailsQuery(),
}))

const mockCanEditSubscription = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/useSubscriptionPermissionsActions', () => ({
  useSubscriptionPermissionsActions: () => ({
    canEditSubscription: mockCanEditSubscription,
    isStatusEditable: jest.fn().mockReturnValue(true),
  }),
}))

describe('SubscriptionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    mockHasPermissions.mockReturnValue(true)
    mockCanEditSubscription.mockReturnValue(true)

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      subscriptionId: 'subscription-1',
    })

    mockUseGetSubscriptionForDetailsQuery.mockReturnValue({
      data: { subscription: mockSubscription },
      loading: false,
      error: null,
    })
  })

  describe('GIVEN the page is rendered with data', () => {
    describe('WHEN in default state', () => {
      it('THEN should configure MainHeader with breadcrumb', () => {
        render(<SubscriptionDetails />)

        expect(capturedConfig?.breadcrumb).toHaveLength(1)
      })

      it('THEN should configure MainHeader with entity', () => {
        render(<SubscriptionDetails />)

        expect(capturedConfig?.entity?.viewName).toBeDefined()
        expect(capturedConfig?.entity?.metadata).toBe('test-plan')
      })

      it('THEN should configure MainHeader with a dropdown action', () => {
        render(<SubscriptionDetails />)

        expect(capturedConfig?.actions).toHaveLength(1)
        expect(capturedConfig?.actions?.[0].type).toBe('dropdown')
      })

      it('THEN should display the active tab content', () => {
        render(<SubscriptionDetails />)

        expect(screen.getByTestId('active-tab-content')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN user does not have subscriptionsUpdate permission', () => {
    beforeEach(() => {
      mockCanEditSubscription.mockReturnValue(false)
    })

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
    ])('THEN should hide $buttonName dropdown item', ({ buttonTestId }) => {
      render(<SubscriptionDetails />)

      const dropdownAction = capturedConfig?.actions?.[0]

      if (dropdownAction?.type === 'dropdown') {
        const item = dropdownAction.items.find((i) => i.dataTest === buttonTestId)

        expect(item?.hidden).toBe(true)
      }
    })
  })

  describe('GIVEN subscription is terminated', () => {
    beforeEach(() => {
      mockUseGetSubscriptionForDetailsQuery.mockReturnValue({
        data: {
          subscription: { ...mockSubscription, status: StatusTypeEnum.Terminated },
        },
        loading: false,
        error: null,
      })
      mockCanEditSubscription.mockReturnValue(false)
    })

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
    ])('THEN should hide $buttonName dropdown item', ({ buttonTestId }) => {
      render(<SubscriptionDetails />)

      const dropdownAction = capturedConfig?.actions?.[0]

      if (dropdownAction?.type === 'dropdown') {
        const item = dropdownAction.items.find((i) => i.dataTest === buttonTestId)

        expect(item?.hidden).toBe(true)
      }
    })
  })

  describe('GIVEN terminating a subscription', () => {
    describe('WHEN customer is NOT deleted', () => {
      it('THEN terminate onClick should call openTerminateCustomerSubscriptionDialog', () => {
        render(<SubscriptionDetails />)

        const dropdownAction = capturedConfig?.actions?.[0]

        if (dropdownAction?.type === 'dropdown') {
          const terminateItem = dropdownAction.items.find(
            (i) => i.dataTest === SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
          )

          terminateItem?.onClick(jest.fn())

          expect(mockOpenTerminateDialog).toHaveBeenCalledWith(
            expect.objectContaining({
              id: 'subscription-1',
              name: 'Test Subscription',
              status: StatusTypeEnum.Active,
            }),
          )
        }
      })

      it('THEN the termination callback should navigate to customer details when customer is not deleted', () => {
        render(<SubscriptionDetails />)

        const dropdownAction = capturedConfig?.actions?.[0]

        if (dropdownAction?.type === 'dropdown') {
          const terminateItem = dropdownAction.items.find(
            (i) => i.dataTest === SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
          )

          terminateItem?.onClick(jest.fn())

          // Extract the callback from the dialog call
          const dialogArgs = mockOpenTerminateDialog.mock.calls[0][0]

          // Simulate customer NOT deleted (null deletedAt)
          dialogArgs.callback(null)

          expect(testMockNavigateFn).toHaveBeenCalledWith(
            CUSTOMER_DETAILS_ROUTE.replace(':customerId', 'customer-1'),
          )
        }
      })
    })

    describe('WHEN customer is deleted', () => {
      it('THEN the termination callback should navigate to subscriptions list', () => {
        render(<SubscriptionDetails />)

        const dropdownAction = capturedConfig?.actions?.[0]

        if (dropdownAction?.type === 'dropdown') {
          const terminateItem = dropdownAction.items.find(
            (i) => i.dataTest === SUBSCRIPTION_DETAILS_TERMINATE_TEST_ID,
          )

          terminateItem?.onClick(jest.fn())

          const dialogArgs = mockOpenTerminateDialog.mock.calls[0][0]

          // Simulate customer deleted (non-null deletedAt)
          dialogArgs.callback('2024-01-01T00:00:00Z')

          expect(testMockNavigateFn).toHaveBeenCalledWith(SUBSCRIPTIONS_ROUTE)
        }
      })
    })
  })
})
