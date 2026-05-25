import { MockedProvider } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'

import { GetPlanForDetailsV2Document } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PLAN_DETAILS_V2_FIXTURE_ID, planDetailsV2Fixture } from './fixtures'

import { PlanDetailsV2 } from '../PlanDetailsV2'

jest.mock('~/components/plans/drawers/planSettings/PlanSettingsDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const PlanSettingsDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }))
    return null
  })

  return { __esModule: true, PlanSettingsDrawer }
})

jest.mock('~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const SubscriptionFeeDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }))
    return null
  })

  return { __esModule: true, SubscriptionFeeDrawer }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const planMock = {
  request: {
    query: GetPlanForDetailsV2Document,
    variables: { planId: PLAN_DETAILS_V2_FIXTURE_ID },
  },
  result: { data: { plan: planDetailsV2Fixture } },
}

describe('PlanDetailsV2', () => {
  it('renders the sidebar and every plan section anchor once the query resolves', async () => {
    render(
      <MockedProvider mocks={[planMock]} addTypename={false}>
        <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} />
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
        <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} isInSubscriptionForm />
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
        <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} />
      </MockedProvider>,
    )

    expect(screen.queryByRole('navigation', { name: /plan sections/i })).not.toBeInTheDocument()
  })
})
