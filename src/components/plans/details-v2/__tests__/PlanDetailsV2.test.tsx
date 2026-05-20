import { MockedProvider } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'

import { CurrencyEnum, GetPlanForDetailsV2Document, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PlanDetailsV2 } from '../PlanDetailsV2'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const PLAN_ID = 'plan_1'

const planMock = {
  request: { query: GetPlanForDetailsV2Document, variables: { planId: PLAN_ID } },
  result: {
    data: {
      plan: {
        __typename: 'Plan',
        id: PLAN_ID,
        name: 'Pro',
        code: 'pro',
        description: null,
        interval: PlanInterval.Monthly,
        amountCurrency: CurrencyEnum.Usd,
        hasOverriddenPlans: false,
      },
    },
  },
}

describe('PlanDetailsV2', () => {
  it('renders the sidebar and every plan section anchor once the query resolves', async () => {
    render(
      <MockedProvider mocks={[planMock]} addTypename={false}>
        <PlanDetailsV2 planId={PLAN_ID} />
      </MockedProvider>,
    )

    await waitFor(() =>
      expect(screen.getByRole('navigation', { name: /plan sections/i })).toBeInTheDocument(),
    )

    for (const id of [
      'plan-settings',
      'subscription-fee',
      'fixed-charges',
      'usage-charges',
      'minimum-commitment',
      'progressive-billing',
      'entitlements',
    ]) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  })

  it('hides the sub-flow sections when isInSubscriptionForm=true', async () => {
    render(
      <MockedProvider mocks={[planMock]} addTypename={false}>
        <PlanDetailsV2 planId={PLAN_ID} isInSubscriptionForm />
      </MockedProvider>,
    )

    await waitFor(() =>
      expect(screen.getByRole('navigation', { name: /plan sections/i })).toBeInTheDocument(),
    )

    expect(document.getElementById('progressive-billing')).toBeNull()
    expect(document.getElementById('entitlements')).toBeNull()
    expect(document.getElementById('minimum-commitment')).not.toBeNull()
  })

  it('does not render the sidebar while the query is loading', () => {
    render(
      <MockedProvider mocks={[planMock]} addTypename={false}>
        <PlanDetailsV2 planId={PLAN_ID} />
      </MockedProvider>,
    )

    expect(screen.queryByRole('navigation', { name: /plan sections/i })).not.toBeInTheDocument()
  })
})
