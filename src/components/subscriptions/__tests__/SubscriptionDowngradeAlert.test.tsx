import { screen } from '@testing-library/react'

import {
  NextSubscriptionTypeEnum,
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionDowngradeAlert } from '../SubscriptionInformations'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (dateStr: string | null | undefined) => ({
      date: `formatted-${dateStr}`,
      time: '',
      timezone: '',
    }),
  }),
}))

const baseSubscription = (
  overrides: Partial<SubscriptionForSubscriptionInformationsFragment> = {},
): SubscriptionForSubscriptionInformationsFragment =>
  ({
    id: 'sub-1',
    externalId: 'ext-1',
    status: StatusTypeEnum.Active,
    subscriptionAt: '2026-01-01',
    endingAt: null,
    terminatedAt: null,
    billingTime: null,
    downgradePlanDate: null,
    nextSubscriptionAt: null,
    nextSubscriptionType: null,
    nextPlan: null,
    previousPlan: null,
    previousSubscription: null,
    customer: {
      id: 'cust-1',
      name: 'Acme',
      displayName: 'Acme',
      externalId: 'cust-ext-1',
      deletedAt: null,
    },
    plan: { id: 'plan-1', name: 'Current', parent: null },
    ...overrides,
  }) as SubscriptionForSubscriptionInformationsFragment

describe('SubscriptionDowngradeAlert', () => {
  it('renders nothing when subscription is null', () => {
    const { container } = render(<SubscriptionDowngradeAlert subscription={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no downgrade conditions are met', () => {
    const { container } = render(<SubscriptionDowngradeAlert subscription={baseSubscription()} />)

    expect(container).toBeEmptyDOMElement()
  })

  describe('WHEN subscription has a pending downgrade (next plan)', () => {
    it('renders the "downgrading to" alert with next plan name and downgrade date', () => {
      const subscription = baseSubscription({
        status: StatusTypeEnum.Active,
        nextSubscriptionType: NextSubscriptionTypeEnum.Downgrade,
        nextPlan: { id: 'plan-2', name: 'Lower plan' },
        downgradePlanDate: '2026-05-22',
      })

      render(<SubscriptionDowngradeAlert subscription={subscription} />)

      expect(screen.getByText('text_62681c60582e4f00aa82938a')).toBeInTheDocument()
    })

    it('renders nothing when nextSubscriptionType is not Downgrade', () => {
      const subscription = baseSubscription({
        nextSubscriptionType: NextSubscriptionTypeEnum.Upgrade,
        nextPlan: { id: 'plan-2', name: 'Higher plan' },
        downgradePlanDate: '2026-05-22',
      })

      const { container } = render(<SubscriptionDowngradeAlert subscription={subscription} />)

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('WHEN subscription is pending (incoming downgrade from previous plan)', () => {
    it('renders the "downgrading from" alert with previous plan name and previous subscription downgrade date', () => {
      const subscription = baseSubscription({
        status: StatusTypeEnum.Pending,
        previousPlan: { id: 'plan-0', name: 'Higher plan' },
        previousSubscription: {
          id: 'sub-0',
          downgradePlanDate: '2026-05-22',
        } as SubscriptionForSubscriptionInformationsFragment['previousSubscription'],
      })

      render(<SubscriptionDowngradeAlert subscription={subscription} />)

      expect(screen.getByText('text_1776951742342o96gqg8qg8j')).toBeInTheDocument()
    })

    it('renders nothing when previousPlan exists but status is not Pending', () => {
      const subscription = baseSubscription({
        status: StatusTypeEnum.Active,
        previousPlan: { id: 'plan-0', name: 'Higher plan' },
        previousSubscription: {
          id: 'sub-0',
          downgradePlanDate: '2026-05-22',
        } as SubscriptionForSubscriptionInformationsFragment['previousSubscription'],
      })

      const { container } = render(<SubscriptionDowngradeAlert subscription={subscription} />)

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('WHEN both conditions are met', () => {
    it('prioritizes the "downgrading to" variant (next plan takes precedence)', () => {
      const subscription = baseSubscription({
        status: StatusTypeEnum.Pending,
        nextSubscriptionType: NextSubscriptionTypeEnum.Downgrade,
        nextPlan: { id: 'plan-2', name: 'Lower plan' },
        downgradePlanDate: '2026-05-22',
        previousPlan: { id: 'plan-0', name: 'Higher plan' },
        previousSubscription: {
          id: 'sub-0',
          downgradePlanDate: '2026-04-22',
        } as SubscriptionForSubscriptionInformationsFragment['previousSubscription'],
      })

      render(<SubscriptionDowngradeAlert subscription={subscription} />)

      expect(screen.getByText('text_62681c60582e4f00aa82938a')).toBeInTheDocument()
      expect(screen.queryByText('text_1776951742342o96gqg8qg8j')).not.toBeInTheDocument()
    })
  })
})
