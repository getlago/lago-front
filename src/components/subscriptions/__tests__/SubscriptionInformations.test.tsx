import {
  ActivationRuleStatusEnum,
  ActivationRuleTypeEnum,
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionInformations } from '../SubscriptionInformations'

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
    endingAt: null,
    terminatedAt: null,
    nextSubscriptionAt: null,
    nextSubscriptionType: null,
    cancellationReason: null,
    activationRules: [],
    nextPlan: null,
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

describe('SubscriptionInformations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN an active subscription without activation rules', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not display the activation rule label', () => {
        const { container } = render(
          <SubscriptionInformations subscription={createSubscription()} />,
        )

        // text_17743520804341uzgeu20x8b = "Activation rule" label
        // text_1774352080434jni2qajf3vs = "Activates on successful payment" value
        expect(container.textContent).not.toContain('text_17743520804341uzgeu20x8b')
        expect(container.textContent).not.toContain('text_1774352080434jni2qajf3vs')
      })

      it('THEN should not display the timeout field label', () => {
        const { container } = render(
          <SubscriptionInformations subscription={createSubscription()} />,
        )

        // text_17743520804341zw721mkq81 = "Subscription times out" label
        expect(container.textContent).not.toContain('text_17743520804341zw721mkq81')
      })
    })
  })

  describe('GIVEN a subscription with a payment activation rule', () => {
    const subscriptionWithPaymentRule = createSubscription({
      status: StatusTypeEnum.Active,
      activationRules: [
        {
          lagoId: 'rule-1',
          type: ActivationRuleTypeEnum.Payment,
          status: ActivationRuleStatusEnum.Active,
          expiresAt: '2026-04-01T00:00:00Z',
          timeoutHours: 24,
        },
      ],
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the activation rule label and value', () => {
        const { container } = render(
          <SubscriptionInformations subscription={subscriptionWithPaymentRule} />,
        )

        expect(container.textContent).toContain('text_17743520804341uzgeu20x8b')
        expect(container.textContent).toContain('text_1774352080434jni2qajf3vs')
      })
    })
  })

  describe('GIVEN an incomplete subscription with a payment activation rule', () => {
    const incompleteSubscription = createSubscription({
      status: StatusTypeEnum.Incomplete,
      activationRules: [
        {
          lagoId: 'rule-1',
          type: ActivationRuleTypeEnum.Payment,
          status: ActivationRuleStatusEnum.Active,
          expiresAt: '2026-04-01T00:00:00Z',
          timeoutHours: 24,
        },
      ],
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the timeout field', () => {
        const { container } = render(
          <SubscriptionInformations subscription={incompleteSubscription} />,
        )

        // text_17743520804341zw721mkq81 = "Subscription times out" label
        expect(container.textContent).toContain('text_17743520804341zw721mkq81')
      })

      it('THEN should display the activation rule label', () => {
        const { container } = render(
          <SubscriptionInformations subscription={incompleteSubscription} />,
        )

        expect(container.textContent).toContain('text_17743520804341uzgeu20x8b')
      })
    })
  })

  describe('GIVEN an active subscription without a payment activation rule', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not display the timeout field', () => {
        const { container } = render(
          <SubscriptionInformations subscription={createSubscription()} />,
        )

        expect(container.textContent).not.toContain('text_17743520804341zw721mkq81')
      })
    })
  })

  describe('GIVEN a canceled subscription with payment reason and payment rule', () => {
    const canceledSubscription = createSubscription({
      status: StatusTypeEnum.Canceled,
      cancellationReason: 'payment_failed',
      activationRules: [
        {
          lagoId: 'rule-1',
          type: ActivationRuleTypeEnum.Payment,
          status: ActivationRuleStatusEnum.Failed,
          expiresAt: '2026-03-01T00:00:00Z',
          timeoutHours: 24,
        },
      ],
    })

    describe('WHEN the component renders', () => {
      it('THEN should display both the activation rule and timeout fields', () => {
        const { container } = render(
          <SubscriptionInformations subscription={canceledSubscription} />,
        )

        expect(container.textContent).toContain('text_17743520804341uzgeu20x8b')
        expect(container.textContent).toContain('text_17743520804341zw721mkq81')
      })
    })
  })
})
