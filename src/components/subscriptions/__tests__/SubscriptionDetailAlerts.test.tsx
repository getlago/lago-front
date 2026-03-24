import { screen } from '@testing-library/react'

import {
  NextSubscriptionTypeEnum,
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionDetailAlerts } from '../SubscriptionDetailAlerts'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '2026-04-01' }),
  }),
}))

const createSubscription = (
  overrides: Partial<SubscriptionForSubscriptionInformationsFragment> = {},
): SubscriptionForSubscriptionInformationsFragment =>
  ({
    id: 'sub-1',
    externalId: 'ext-sub-1',
    status: StatusTypeEnum.Active,
    subscriptionAt: '2026-01-01T00:00:00Z',
    nextSubscriptionType: null,
    nextPlan: null,
    cancellationReason: null,
    activationRules: [],
    customer: {
      id: 'cust-1',
      name: 'Test Customer',
      displayName: 'Test Customer',
      externalId: 'ext-cust-1',
      deletedAt: null,
    },
    plan: {
      id: 'plan-1',
      name: 'Basic Plan',
      parent: null,
    },
    ...overrides,
  }) as SubscriptionForSubscriptionInformationsFragment

describe('SubscriptionDetailAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a subscription with no special conditions', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not display any alerts', () => {
        render(<SubscriptionDetailAlerts subscription={createSubscription()} />)

        expect(screen.queryByTestId('alert-type-info')).not.toBeInTheDocument()
        expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a subscription with a pending downgrade', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the downgrade info alert', () => {
        const subscription = createSubscription({
          nextPlan: { id: 'plan-2', name: 'Starter Plan' },
          nextSubscriptionType: NextSubscriptionTypeEnum.Downgrade,
          nextSubscriptionAt: '2026-04-01T00:00:00Z',
        })

        render(<SubscriptionDetailAlerts subscription={subscription} />)

        expect(screen.getByTestId('alert-type-info')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an incomplete subscription', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the incomplete warning alert', () => {
        const subscription = createSubscription({
          status: StatusTypeEnum.Incomplete,
        })

        render(<SubscriptionDetailAlerts subscription={subscription} />)

        expect(screen.getByTestId('alert-type-warning')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a canceled subscription with payment_failed reason', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the canceled info alert', () => {
        const subscription = createSubscription({
          status: StatusTypeEnum.Canceled,
          cancellationReason: 'payment_failed',
        })

        render(<SubscriptionDetailAlerts subscription={subscription} />)

        expect(screen.getByTestId('alert-type-info')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a canceled subscription with timeout reason', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the canceled info alert', () => {
        const subscription = createSubscription({
          status: StatusTypeEnum.Canceled,
          cancellationReason: 'timeout',
        })

        render(<SubscriptionDetailAlerts subscription={subscription} />)

        expect(screen.getByTestId('alert-type-info')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an incomplete subscription with a downgrade', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display both the downgrade info alert and the incomplete warning alert', () => {
        const subscription = createSubscription({
          status: StatusTypeEnum.Incomplete,
          nextPlan: { id: 'plan-2', name: 'Starter Plan' },
          nextSubscriptionType: NextSubscriptionTypeEnum.Downgrade,
          nextSubscriptionAt: '2026-04-01T00:00:00Z',
        })

        render(<SubscriptionDetailAlerts subscription={subscription} />)

        expect(screen.getByTestId('alert-type-info')).toBeInTheDocument()
        expect(screen.getByTestId('alert-type-warning')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no subscription', () => {
    describe('WHEN the component renders with undefined', () => {
      it('THEN should not display any alerts', () => {
        render(<SubscriptionDetailAlerts subscription={undefined} />)

        expect(screen.queryByTestId('alert-type-info')).not.toBeInTheDocument()
        expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()
      })
    })
  })
})
