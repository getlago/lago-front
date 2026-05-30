import { MockedProvider } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'

import { GetSubscriptionForDetailsV2PlanDocument } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionDetailsV2Plan } from '../SubscriptionDetailsV2Plan'

const capturedProps: Array<Record<string, unknown>> = []

jest.mock('~/components/plans/details-v2/PlanDetailsV2', () => ({
  __esModule: true,
  PlanDetailsV2: (props: Record<string, unknown>) => {
    capturedProps.push(props)
    return null
  },
}))

jest.mock('~/components/premium/PremiumFeature', () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual('react')

    return React.createElement('div', { 'data-test': 'premium-feature' })
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

let mockIsPremium = true

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

const SUB_ID = 'sub_1'

const queryMock = {
  request: {
    query: GetSubscriptionForDetailsV2PlanDocument,
    variables: { subscriptionId: SUB_ID },
  },
  result: {
    data: {
      subscription: {
        id: SUB_ID,
        plan: { id: 'plan_override_1' },
      },
    },
  },
}

describe('SubscriptionDetailsV2Plan', () => {
  beforeEach(() => {
    capturedProps.length = 0
    mockIsPremium = true
  })

  it('renders PlanDetailsV2 in subscription mode with the override plan id (premium)', async () => {
    render(
      <MockedProvider mocks={[queryMock]} addTypename={false}>
        <SubscriptionDetailsV2Plan subscriptionId={SUB_ID} />
      </MockedProvider>,
    )

    await waitFor(() => expect(capturedProps.length).toBeGreaterThan(0))
    const props = capturedProps[capturedProps.length - 1]
    expect(props.planId).toBe('plan_override_1')
    expect(props.isInSubscriptionForm).toBe(true)
    expect(props.subscriptionId).toBe(SUB_ID)
    // Premium users see no upsell.
    expect(screen.queryByTestId('premium-feature')).not.toBeInTheDocument()
  })

  // Drift test: subscription plan overrides are premium-gated — non-premium users
  // get the upsell over a gated preview, mirroring the subscription edit form.
  it('shows the premium upsell for non-premium users', async () => {
    mockIsPremium = false

    render(
      <MockedProvider mocks={[queryMock]} addTypename={false}>
        <SubscriptionDetailsV2Plan subscriptionId={SUB_ID} />
      </MockedProvider>,
    )

    expect(await screen.findByTestId('premium-feature')).toBeInTheDocument()
  })
})
