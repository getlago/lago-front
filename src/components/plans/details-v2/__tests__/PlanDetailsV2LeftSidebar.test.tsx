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
        text_17793007079352nuwx5wx9uj: 'Add fixed charge',
        text_1779300707935ah1fv0kiyz6: 'Add usage charge',
      }

      return map[key] ?? key
    },
  }),
}))

const renderSidebar = (
  props: Partial<React.ComponentProps<typeof PlanDetailsV2LeftSidebar>> = {},
) =>
  render(
    <PlanDetailsV2LeftSidebar
      activeSectionId="plan-settings"
      onItemClick={jest.fn()}
      {...props}
    />,
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
  // User-confirmed: Advanced group + Min commitment always visible; only Progressive billing
  // and Entitlements hide in sub mode.
  it('drops Progressive billing + Entitlements when isInSubscriptionForm=true (Min commitment stays)', () => {
    renderSidebar({ isInSubscriptionForm: true })

    expect(screen.queryByText('Progressive billing')).not.toBeInTheDocument()
    expect(screen.queryByText('Entitlements')).not.toBeInTheDocument()
    expect(screen.getByText('Minimum commitment')).toBeInTheDocument()
    expect(screen.getByText('Advanced settings')).toBeInTheDocument()
  })

  it('marks the active leaf item with aria-current', () => {
    renderSidebar({ activeSectionId: 'subscription-fee' })

    expect(screen.getByRole('button', { name: 'Subscription fee' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('marks the active group item with aria-current on the label button', () => {
    renderSidebar({ activeSectionId: 'fixed-charges' })

    expect(screen.getByRole('button', { name: 'Fixed charges' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('fires onItemClick with the section id when a leaf item is clicked', async () => {
    const handleClick = jest.fn()

    renderSidebar({ onItemClick: handleClick })

    await userEvent.click(screen.getByRole('button', { name: 'Subscription fee' }))

    expect(handleClick).toHaveBeenCalledWith('subscription-fee')
  })

  it('fires onItemClick with the section id when a group label is clicked', async () => {
    const handleClick = jest.fn()

    renderSidebar({ onItemClick: handleClick })

    await userEvent.click(screen.getByRole('button', { name: 'Fixed charges' }))

    expect(handleClick).toHaveBeenCalledWith('fixed-charges')
  })

  describe('plus add button', () => {
    it('renders the plus button on Fixed charges and Usage-based charges when onAddClick provided', () => {
      renderSidebar({ onAddClick: jest.fn() })

      expect(screen.getByRole('button', { name: 'Add fixed charge' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add usage charge' })).toBeInTheDocument()
    })

    it('does not render the plus button when onAddClick is not provided', () => {
      renderSidebar()

      expect(screen.queryByRole('button', { name: 'Add fixed charge' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add usage charge' })).not.toBeInTheDocument()
    })

    // Drift test — locks in spec §5 "Add CTAs hidden when isInSubscriptionForm"
    it('hides the plus button when isInSubscriptionForm=true (no Add CTAs in sub mode)', () => {
      renderSidebar({ onAddClick: jest.fn(), isInSubscriptionForm: true })

      expect(screen.queryByRole('button', { name: 'Add fixed charge' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add usage charge' })).not.toBeInTheDocument()
    })

    it('never renders a plus button on the Advanced settings group', () => {
      renderSidebar({ onAddClick: jest.fn() })

      // Only 2 plus buttons total — for Fixed charges + Usage-based charges
      const plusButtons = screen.getAllByRole('button', { name: /add .* charge/i })

      expect(plusButtons).toHaveLength(2)
    })

    it('fires onAddClick with the section id and does NOT fire onItemClick', async () => {
      const onItemClick = jest.fn()
      const onAddClick = jest.fn()

      renderSidebar({ onItemClick, onAddClick })

      await userEvent.click(screen.getByRole('button', { name: 'Add fixed charge' }))

      expect(onAddClick).toHaveBeenCalledWith('fixed-charges')
      expect(onItemClick).not.toHaveBeenCalled()
    })
  })

  describe('chevron toggle', () => {
    it('toggles expanded state without firing onItemClick', async () => {
      const onItemClick = jest.fn()

      renderSidebar({ onItemClick })

      // Advanced settings is expanded by default — children visible
      expect(screen.getByText('Minimum commitment')).toBeInTheDocument()

      await userEvent.click(
        screen.getByRole('button', { name: /Collapse Advanced settings/i }),
      )

      expect(screen.queryByText('Minimum commitment')).not.toBeInTheDocument()
      expect(onItemClick).not.toHaveBeenCalled()
    })
  })
})
