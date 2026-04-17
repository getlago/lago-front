import { screen } from '@testing-library/react'

import { PlanInterval, StatusTypeEnum, Subscription, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionsList } from '../SubscriptionsList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/useSubscriptionPermissionsActions', () => ({
  useSubscriptionPermissionsActions: () => ({
    isStatusEditable: (status: string | null | undefined) =>
      status !== 'terminated' && status !== 'canceled' && status !== 'incomplete',
  }),
}))

const mockOpenTerminateDialog = jest.fn()

jest.mock('~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog', () => ({
  useTerminateCustomerSubscriptionDialog: () => ({
    openTerminateCustomerSubscriptionDialog: mockOpenTerminateDialog,
  }),
}))

const createSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: 'sub-1',
    externalId: 'ext-sub-1',
    name: 'Test Subscription',
    status: StatusTypeEnum.Active,
    startedAt: '2026-01-01T00:00:00Z',
    subscriptionAt: '2026-01-01T00:00:00Z',
    endingAt: null,
    terminatedAt: null,
    nextPlan: null,
    nextSubscriptionAt: null,
    nextSubscriptionType: null,
    nextName: null,
    nextSubscription: null,
    plan: {
      id: 'plan-1',
      name: 'Basic Plan',
      interval: PlanInterval.Monthly,
      payInAdvance: false,
      isOverridden: false,
      parent: null,
    },
    customer: {
      id: 'cust-1',
      name: 'Test Customer',
      displayName: 'Test Customer',
      externalId: 'ext-cust-1',
      applicableTimezone: TimezoneEnum.TzUtc,
    },
    ...overrides,
  }) as unknown as Subscription

const renderSubscriptionsList = (subscriptions: Subscription[]) => {
  return render(
    <SubscriptionsList
      name="subscriptions-list"
      subscriptions={subscriptions}
      customerId="cust-1"
      columns={[
        {
          key: 'name',
          title: 'Name',
          content: (row) => row.name,
        },
      ]}
    />,
  )
}

describe('SubscriptionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a list with an active subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the subscription row', () => {
        renderSubscriptionsList([createSubscription()])

        expect(screen.getByTestId('Test Subscription')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a list with an incomplete subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the subscription row', () => {
        renderSubscriptionsList([
          createSubscription({
            name: 'Incomplete Sub',
            status: StatusTypeEnum.Incomplete,
          }),
        ])

        expect(screen.getByTestId('Incomplete Sub')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN subscriptions with different statuses', () => {
    describe('WHEN rendering terminated, canceled, and incomplete subscriptions', () => {
      it('THEN should display all subscription rows', () => {
        renderSubscriptionsList([
          createSubscription({
            id: 'sub-terminated',
            name: 'Terminated Sub',
            status: StatusTypeEnum.Terminated,
            terminatedAt: '2026-02-01T00:00:00Z',
          }),
          createSubscription({
            id: 'sub-canceled',
            name: 'Canceled Sub',
            status: StatusTypeEnum.Canceled,
          }),
          createSubscription({
            id: 'sub-incomplete',
            name: 'Incomplete Sub',
            status: StatusTypeEnum.Incomplete,
          }),
        ])

        expect(screen.getByTestId('Terminated Sub')).toBeInTheDocument()
        expect(screen.getByTestId('Canceled Sub')).toBeInTheDocument()
        expect(screen.getByTestId('Incomplete Sub')).toBeInTheDocument()
      })
    })
  })
})
