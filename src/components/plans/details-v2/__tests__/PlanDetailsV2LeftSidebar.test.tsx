import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { PlanDetailsV2LeftSidebar } from '../PlanDetailsV2LeftSidebar'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => {
      const map: Record<string, string> = {
        text_177928991586601f21f0x87c: 'Plan settings',
        text_1779289915866etwoweh1syv: 'Subscription fee',
        text_1779289915866aj39dyv1wps: 'Fixed charges',
        text_1779289915866ngi8sv5t9lg: 'Usage-based charges',
        text_1779289915866m899iy5nykb: 'Advanced settings',
        text_17792899158664ii2pmrd2le: 'Minimum commitment',
        text_1779289915866vguw0lfmz06: 'Progressive billing',
        text_1779289915866mr56w61hhi5: 'Entitlements',
      }

      return map[key] ?? key
    },
  }),
}))

const renderSidebar = (
  props: Partial<React.ComponentProps<typeof PlanDetailsV2LeftSidebar>> = {},
) =>
  render(
    <PlanDetailsV2LeftSidebar activeSectionId="plan-settings" onItemClick={jest.fn()} {...props} />,
  )

describe('PlanDetailsV2LeftSidebar', () => {
  it('renders every plan-level section', () => {
    renderSidebar()

    for (const label of [
      'Plan settings',
      'Subscription fee',
      'Fixed charges',
      'Usage-based charges',
      'Advanced settings',
      'Minimum commitment',
      'Progressive billing',
      'Entitlements',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  // Drift test — locks in the sub-flow gating contract per spec §5.
  // Future refactor that flattens Advanced or drops the gate must fail loudly here.
  it('drops Progressive billing + Entitlements when isInSubscriptionForm=true', () => {
    renderSidebar({ isInSubscriptionForm: true })

    expect(screen.queryByText('Progressive billing')).not.toBeInTheDocument()
    expect(screen.queryByText('Entitlements')).not.toBeInTheDocument()
    // Min commitment STAYS (paywall handled elsewhere — see spec §5)
    expect(screen.getByText('Minimum commitment')).toBeInTheDocument()
    expect(screen.getByText('Advanced settings')).toBeInTheDocument()
  })

  it('marks the active item with aria-current', () => {
    renderSidebar({ activeSectionId: 'fixed-charges' })

    expect(screen.getByRole('button', { name: /fixed charges/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('fires onItemClick with the section id when an item is clicked', async () => {
    const handleClick = jest.fn()

    renderSidebar({ onItemClick: handleClick })

    await userEvent.click(screen.getByRole('button', { name: /subscription fee/i }))

    expect(handleClick).toHaveBeenCalledWith('subscription-fee')
  })
})
