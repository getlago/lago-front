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
) => render(<PlanDetailsV2LeftSidebar onItemClick={jest.fn()} {...props} />)

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
    it('always renders the plus button on Fixed charges and Usage-based charges (even without onAddClick)', () => {
      renderSidebar()

      expect(screen.getByTestId('sidebar-add-fixed-charges')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-add-usage-charges')).toBeInTheDocument()
    })

    // Drift test — locks in spec §5 "Add CTAs hidden when isInSubscriptionForm"
    it('hides the plus button when isInSubscriptionForm=true (no Add CTAs in sub mode)', () => {
      renderSidebar({ isInSubscriptionForm: true })

      expect(screen.queryByTestId('sidebar-add-fixed-charges')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-add-usage-charges')).not.toBeInTheDocument()
    })

    it('never renders a plus button on the Advanced settings group', () => {
      renderSidebar()

      expect(screen.queryByTestId('sidebar-add-advanced-settings')).not.toBeInTheDocument()
    })

    it('fires onAddClick with the section id and does NOT fire onItemClick', async () => {
      const onItemClick = jest.fn()
      const onAddClick = jest.fn()

      renderSidebar({ onItemClick, onAddClick })

      await userEvent.click(screen.getByTestId('sidebar-add-fixed-charges'))

      expect(onAddClick).toHaveBeenCalledWith('fixed-charges')
      expect(onItemClick).not.toHaveBeenCalled()
    })

    it('clicking the plus button is a no-op when onAddClick is not provided (does not throw)', async () => {
      const onItemClick = jest.fn()

      renderSidebar({ onItemClick })

      await userEvent.click(screen.getByTestId('sidebar-add-fixed-charges'))

      expect(onItemClick).not.toHaveBeenCalled()
    })
  })

  describe('charge folder children', () => {
    const fixedCharges = [
      {
        id: 'fc-1',
        invoiceDisplayName: 'Premium seats',
        code: 'seats',
        addOn: { id: 'ao-1', name: 'Seats' },
      },
      { id: 'fc-2', invoiceDisplayName: null, code: 'cards', addOn: { id: 'ao-2', name: 'Cards' } },
      {
        id: 'fc-3',
        invoiceDisplayName: null,
        code: 'fallback-code',
        addOn: { id: 'ao-3', name: '' },
      },
    ]
    const usageCharges = [
      {
        id: 'uc-1',
        invoiceDisplayName: null,
        code: 'api',
        billableMetric: { id: 'bm-1', name: 'API calls' },
      },
    ]

    it('lists charges with invoiceDisplayName || addOn/metric name || code once the folder is expanded', async () => {
      renderSidebar({ fixedCharges, usageCharges })

      // Folders are collapsed by default — children hidden until toggled.
      expect(screen.queryByText('Premium seats')).not.toBeInTheDocument()

      await userEvent.click(screen.getByTestId('sidebar-toggle-fixed-charges'))

      expect(screen.getByText('Premium seats')).toBeInTheDocument() // invoiceDisplayName
      expect(screen.getByText('Cards')).toBeInTheDocument() // addOn.name fallback
      expect(screen.getByText('fallback-code')).toBeInTheDocument() // code fallback

      await userEvent.click(screen.getByTestId('sidebar-toggle-usage-charges'))

      expect(screen.getByText('API calls')).toBeInTheDocument() // billableMetric.name fallback
    })

    it('fires onItemClick with the charge id when a charge child is clicked', async () => {
      const onItemClick = jest.fn()

      renderSidebar({ fixedCharges, onItemClick })

      await userEvent.click(screen.getByTestId('sidebar-toggle-fixed-charges'))
      await userEvent.click(screen.getByRole('button', { name: 'Premium seats' }))

      expect(onItemClick).toHaveBeenCalledWith('fc-1')
    })
  })

  describe('chevron toggle', () => {
    it('toggles expanded state without firing onItemClick', async () => {
      const onItemClick = jest.fn()

      renderSidebar({ onItemClick })

      // Advanced settings is expanded by default — children visible
      expect(screen.getByText('Minimum commitment')).toBeInTheDocument()

      await userEvent.click(screen.getByTestId('sidebar-toggle-advanced-settings'))

      expect(screen.queryByText('Minimum commitment')).not.toBeInTheDocument()
      expect(onItemClick).not.toHaveBeenCalled()
    })
  })
})
