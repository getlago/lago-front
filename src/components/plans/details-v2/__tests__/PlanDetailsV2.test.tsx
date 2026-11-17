import { MockedProvider } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetPlanForDetailsV2Document } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PLAN_DETAILS_V2_FIXTURE_ID, planDetailsV2Fixture } from './fixtures'

import { PlanDetailsV2 } from '../PlanDetailsV2'

const mockHasPermissions = jest.fn(() => true)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

// Fires onAddClick directly, bypassing the real sidebar's own button-visibility
// gate, to test PlanDetailsV2's handleAddClick guard in isolation.
jest.mock('~/components/plans/details-v2/PlanDetailsV2LeftSidebar', () => {
  const React = jest.requireActual('react')

  return {
    __esModule: true,
    PlanDetailsV2LeftSidebar: ({ onAddClick }: { onAddClick?: (id: string) => void }) =>
      React.createElement(
        'nav',
        { 'aria-label': 'Plan sections' },
        React.createElement(
          'button',
          { onClick: () => onAddClick?.('fixed-charges') },
          'add-fixed-charges',
        ),
        React.createElement(
          'button',
          { onClick: () => onAddClick?.('usage-charges') },
          'add-usage-charges',
        ),
        React.createElement(
          'button',
          { onClick: () => onAddClick?.('entitlements') },
          'add-entitlements',
        ),
      ),
  }
})

// Mock the drawer hook (not a component): the section calls usePlanSettingsDrawer
// which pulls in the NiceModal drawer stack (drawerStack.ts uses import.meta and
// crashes Jest), so stub it to a no-op openDrawer.
jest.mock('~/components/plans/drawers/planSettings/usePlanSettingsDrawer', () => ({
  usePlanSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const SubscriptionFeeDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }))
    return null
  })

  return { __esModule: true, SubscriptionFeeDrawer }
})

const mockFixedChargeOpenDrawer = jest.fn()
const mockUsageChargeOpenDrawer = jest.fn()

jest.mock('~/components/plans/drawers/fixedCharge/FixedChargeDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const FixedChargeDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({
      openDrawer: mockFixedChargeOpenDrawer,
      closeDrawer: jest.fn(),
    }))
    return null
  })

  return { __esModule: true, FixedChargeDrawer }
})

jest.mock('~/components/plans/drawers/usageCharge/UsageChargeDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const UsageChargeDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({
      openDrawer: mockUsageChargeOpenDrawer,
      closeDrawer: jest.fn(),
    }))
    return null
  })

  return { __esModule: true, UsageChargeDrawer }
})

jest.mock('~/components/plans/details-v2/accordions/MinimumCommitmentAccordion', () => {
  const React = jest.requireActual('react')

  return {
    __esModule: true,
    MinimumCommitmentAccordion: () => React.createElement('section', { id: 'minimum-commitment' }),
  }
})

jest.mock('~/components/plans/details-v2/accordions/ProgressiveBillingAccordion', () => {
  const React = jest.requireActual('react')

  return {
    __esModule: true,
    ProgressiveBillingAccordion: () =>
      React.createElement('section', { id: 'progressive-billing' }),
  }
})

const mockEntitlementOpenCreate = jest.fn()

jest.mock('~/components/plans/details-v2/accordions/EntitlementAccordion', () => {
  const { createElement, forwardRef, useImperativeHandle } = jest.requireActual('react')

  const EntitlementAccordion = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openCreate: mockEntitlementOpenCreate }))
    return createElement('section', { id: 'entitlements' })
  })

  return { __esModule: true, EntitlementAccordion }
})

jest.mock('~/components/plans/details-v2/accordions/MetadataAccordion', () => {
  const React = jest.requireActual('react')

  return {
    __esModule: true,
    MetadataAccordion: () => React.createElement('section', { id: 'metadata' }),
  }
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
  it('renders a provided plan without querying the root plan', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} plan={planDetailsV2Fixture} />
      </MockedProvider>,
    )

    expect(screen.getByRole('navigation', { name: /plan sections/i })).toBeInTheDocument()
  })

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

  describe('handleAddClick permission guard', () => {
    beforeEach(() => {
      mockHasPermissions.mockReset().mockReturnValue(true)
      mockFixedChargeOpenDrawer.mockReset()
      mockUsageChargeOpenDrawer.mockReset()
      mockEntitlementOpenCreate.mockReset()
    })

    it('does not open the create drawer when chargesCreate is missing, even if the add shortcut fires', async () => {
      mockHasPermissions.mockImplementation(
        ((perms: string[]) => !perms.includes('chargesCreate')) as never,
      )

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} plan={planDetailsV2Fixture} />
        </MockedProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'add-fixed-charges' }))
      await userEvent.click(screen.getByRole('button', { name: 'add-usage-charges' }))

      expect(mockFixedChargeOpenDrawer).not.toHaveBeenCalled()
      expect(mockUsageChargeOpenDrawer).not.toHaveBeenCalled()
    })

    it('opens the create drawer via the add shortcut when chargesCreate is granted', async () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} plan={planDetailsV2Fixture} />
        </MockedProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'add-fixed-charges' }))
      await userEvent.click(screen.getByRole('button', { name: 'add-usage-charges' }))

      expect(mockFixedChargeOpenDrawer).toHaveBeenCalled()
      expect(mockUsageChargeOpenDrawer).toHaveBeenCalled()
    })

    // Entitlements submit through updatePlan (plans:update), unlike charges - so
    // this checks plansUpdate rather than chargesCreate.
    it('does not open the entitlement drawer when plansUpdate is missing, even if the add shortcut fires', async () => {
      mockHasPermissions.mockImplementation(
        ((perms: string[]) => !perms.includes('plansUpdate')) as never,
      )

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} plan={planDetailsV2Fixture} />
        </MockedProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'add-entitlements' }))

      expect(mockEntitlementOpenCreate).not.toHaveBeenCalled()
    })

    it('opens the entitlement drawer via the add shortcut when plansUpdate is granted', async () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <PlanDetailsV2 planId={PLAN_DETAILS_V2_FIXTURE_ID} plan={planDetailsV2Fixture} />
        </MockedProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'add-entitlements' }))

      expect(mockEntitlementOpenCreate).toHaveBeenCalled()
    })
  })
})
