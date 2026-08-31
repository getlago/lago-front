import { ActionItem } from '~/components/designSystem/Table/types'
import {
  AnnotatedSubscription,
  SUBSCRIPTIONS_LIST_CANCEL_TEST_ID,
  SUBSCRIPTIONS_LIST_TERMINATE_TEST_ID,
  SubscriptionsList,
} from '~/components/subscriptions/SubscriptionsList'
import { PlanInterval, StatusTypeEnum, Subscription, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

const mockTableProps = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

const mockOpenTerminateDialog = jest.fn()

jest.mock('~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog', () => ({
  useTerminateCustomerSubscriptionDialog: () => ({
    openTerminateCustomerSubscriptionDialog: mockOpenTerminateDialog,
  }),
}))

const mockHasPermissions = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useSubscriptionPermissionsActions', () => ({
  useSubscriptionPermissionsActions: () => ({ isStatusEditable: () => true }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const buildSubscription = (status: StatusTypeEnum) =>
  ({
    id: 'subscription-1',
    externalId: 'ext-123',
    name: 'Test Subscription',
    status,
    startedAt: '2024-01-01T00:00:00Z',
    subscriptionAt: '2024-01-01T00:00:00Z',
    plan: {
      id: 'plan-1',
      name: 'Test Plan',
      interval: PlanInterval.Monthly,
      payInAdvance: false,
    },
    customer: {
      id: 'customer-1',
      applicableTimezone: TimezoneEnum.TzUtc,
    },
  }) as unknown as Subscription

const getActions = (status: StatusTypeEnum): ActionItem<AnnotatedSubscription>[] => {
  render(
    <SubscriptionsList
      name="subscriptions-list"
      columns={[]}
      subscriptions={[buildSubscription(status)]}
    />,
  )

  const tableProps = mockTableProps.mock.calls.at(-1)?.[0] as {
    data: AnnotatedSubscription[]
    actionColumn: (item: AnnotatedSubscription) => ActionItem<AnnotatedSubscription>[]
  }

  return tableProps.actionColumn(tableProps.data[0])
}

// The action icons identify each entry without leaning on its wording. Whether the last
// action cancels or terminates is asserted on its dataTest, since both share the same icon.
const getActionIcons = (status: StatusTypeEnum): unknown[] =>
  getActions(status).map((action) => action.startIcon)

const getEndingActionTestId = (status: StatusTypeEnum): unknown =>
  getActions(status).at(-1)?.dataTest

describe('SubscriptionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN an incomplete subscription', () => {
    describe('WHEN the user has the subscriptionsUpdate permission', () => {
      it('THEN should only offer copying the id and cancelling', () => {
        expect(getActionIcons(StatusTypeEnum.Incomplete)).toEqual(['duplicate', 'trash'])
        expect(getEndingActionTestId(StatusTypeEnum.Incomplete)).toBe(
          SUBSCRIPTIONS_LIST_CANCEL_TEST_ID,
        )
      })

      it('THEN should open the terminate dialog with the incomplete status', () => {
        const actions = getActions(StatusTypeEnum.Incomplete)
        const cancelAction = actions.find(
          (action) => action.dataTest === SUBSCRIPTIONS_LIST_CANCEL_TEST_ID,
        )

        cancelAction?.onAction({} as AnnotatedSubscription)

        expect(mockOpenTerminateDialog).toHaveBeenCalledWith({
          id: 'subscription-1',
          name: 'Test Subscription',
          status: StatusTypeEnum.Incomplete,
          payInAdvance: false,
        })
      })
    })

    describe('WHEN the user lacks the subscriptionsUpdate permission', () => {
      it('THEN should only offer copying the id', () => {
        mockHasPermissions.mockReturnValue(false)

        expect(getActionIcons(StatusTypeEnum.Incomplete)).toEqual(['duplicate'])
      })
    })
  })

  describe('GIVEN an active subscription', () => {
    it('THEN should keep the edit actions and label the last one as terminate', () => {
      expect(getActionIcons(StatusTypeEnum.Active)).toEqual([
        'text',
        'board',
        'pen',
        'duplicate',
        'bell',
        'trash',
      ])
      expect(getEndingActionTestId(StatusTypeEnum.Active)).toBe(
        SUBSCRIPTIONS_LIST_TERMINATE_TEST_ID,
      )
    })
  })

  describe('GIVEN a pending subscription', () => {
    it('THEN should keep the edit actions and label the last one as cancel', () => {
      expect(getActionIcons(StatusTypeEnum.Pending)).toEqual([
        'text',
        'board',
        'pen',
        'duplicate',
        'bell',
        'trash',
      ])
      expect(getEndingActionTestId(StatusTypeEnum.Pending)).toBe(SUBSCRIPTIONS_LIST_CANCEL_TEST_ID)
    })
  })

  describe.each([StatusTypeEnum.Terminated, StatusTypeEnum.Canceled])(
    'GIVEN a %s subscription',
    (status) => {
      it('THEN should only offer copying the id', () => {
        expect(getActionIcons(status)).toEqual(['duplicate'])
      })
    },
  )
})
