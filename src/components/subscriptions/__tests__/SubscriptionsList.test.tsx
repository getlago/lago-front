import { ActionItem } from '~/components/designSystem/Table/types'
import {
  AnnotatedSubscription,
  SubscriptionsList,
} from '~/components/subscriptions/SubscriptionsList'
import { PlanInterval, StatusTypeEnum, Subscription, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

const COPY_ID_KEY = 'text_62d7f6178ec94cd09370e65b'
const SUBSCRIPTION_DETAILS_KEY = 'text_62d7f6178ec94cd09370e63c'
const SUBSCRIPTION_PLAN_KEY = 'text_17810297639135ya0hmsldpi'
const UPGRADE_DOWNGRADE_KEY = 'text_62d7f6178ec94cd09370e64a'
const ALERTS_KEY = 'text_1746785137190vu5wwlsmzmz'
const CANCEL_SUBSCRIPTION_KEY = 'text_64a6d736c23125004817627f'
const TERMINATE_SUBSCRIPTION_KEY = 'text_62d904b97e690a881f2b867c'

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

const getActionTitles = (status: StatusTypeEnum): unknown[] =>
  getActions(status).map((action) => action.title)

describe('SubscriptionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN an incomplete subscription', () => {
    describe('WHEN the user has the subscriptionsUpdate permission', () => {
      it('THEN should only offer copying the id and cancelling', () => {
        expect(getActionTitles(StatusTypeEnum.Incomplete)).toEqual([
          COPY_ID_KEY,
          CANCEL_SUBSCRIPTION_KEY,
        ])
      })

      it('THEN should open the terminate dialog with the incomplete status', () => {
        const actions = getActions(StatusTypeEnum.Incomplete)
        const cancelAction = actions.find((action) => action.title === CANCEL_SUBSCRIPTION_KEY)

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

        expect(getActionTitles(StatusTypeEnum.Incomplete)).toEqual([COPY_ID_KEY])
      })
    })
  })

  describe('GIVEN an active subscription', () => {
    it('THEN should keep the edit actions and label the last one as terminate', () => {
      expect(getActionTitles(StatusTypeEnum.Active)).toEqual([
        SUBSCRIPTION_DETAILS_KEY,
        SUBSCRIPTION_PLAN_KEY,
        UPGRADE_DOWNGRADE_KEY,
        COPY_ID_KEY,
        ALERTS_KEY,
        TERMINATE_SUBSCRIPTION_KEY,
      ])
    })
  })

  describe('GIVEN a pending subscription', () => {
    it('THEN should keep the edit actions and label the last one as cancel', () => {
      expect(getActionTitles(StatusTypeEnum.Pending)).toEqual([
        SUBSCRIPTION_DETAILS_KEY,
        SUBSCRIPTION_PLAN_KEY,
        UPGRADE_DOWNGRADE_KEY,
        COPY_ID_KEY,
        ALERTS_KEY,
        CANCEL_SUBSCRIPTION_KEY,
      ])
    })
  })

  describe.each([StatusTypeEnum.Terminated, StatusTypeEnum.Canceled])(
    'GIVEN a %s subscription',
    (status) => {
      it('THEN should only offer copying the id', () => {
        expect(getActionTitles(status)).toEqual([COPY_ID_KEY])
      })
    },
  )
})
