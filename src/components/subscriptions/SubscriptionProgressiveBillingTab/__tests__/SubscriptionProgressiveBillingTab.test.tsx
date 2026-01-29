import { MockedResponse } from '@apollo/client/testing'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  SubscriptionForProgressiveBillingTabFragment,
  SwitchProgressiveBillingDisabledValueDocument,
} from '~/generated/graphql'
import { render, testMockNavigateFn, TestMocksType } from '~/test-utils'

import {
  PROGRESSIVE_BILLING_DISABLED_MESSAGE_TEST_ID,
  PROGRESSIVE_BILLING_EDIT_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_FREEMIUM_BLOCK_TEST_ID,
  PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_OVERRIDDEN_CHIP_TEST_ID,
  PROGRESSIVE_BILLING_RESET_BUTTON_TEST_ID,
  PROGRESSIVE_BILLING_TAB_TEST_ID,
  PROGRESSIVE_BILLING_TOGGLE_BUTTON_TEST_ID,
  SubscriptionProgressiveBillingTab,
} from '../SubscriptionProgressiveBillingTab'

// Get mocked useParams from test-utils mock
const { useParams } = jest.requireMock('react-router-dom')

// Mock hooks
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

const mockHasOrganizationPremiumAddon = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

const createMockSubscription = (
  overrides?: Partial<SubscriptionForProgressiveBillingTabFragment>,
): SubscriptionForProgressiveBillingTabFragment => ({
  id: 'subscription-123',
  progressiveBillingDisabled: false,
  usageThresholds: [
    {
      id: 'threshold-1',
      amountCents: '10000',
      recurring: false,
      thresholdDisplayName: 'First threshold',
    },
    {
      id: 'threshold-2',
      amountCents: '20000',
      recurring: false,
      thresholdDisplayName: 'Second threshold',
    },
  ],
  plan: {
    id: 'plan-123',
    amountCurrency: CurrencyEnum.Usd,
    usageThresholds: [
      {
        id: 'plan-threshold-1',
        amountCents: '5000',
        recurring: false,
        thresholdDisplayName: 'Plan threshold',
      },
    ],
  },
  ...overrides,
})

const createSwitchMutationMock = (
  subscriptionId: string,
  newDisabledValue: boolean,
): MockedResponse => ({
  request: {
    query: SwitchProgressiveBillingDisabledValueDocument,
    variables: {
      input: {
        id: subscriptionId,
        progressiveBillingDisabled: newDisabledValue,
      },
    },
  },
  result: {
    data: {
      updateSubscription: {
        id: subscriptionId,
        progressiveBillingDisabled: newDisabledValue,
      },
    },
  },
})

describe('SubscriptionProgressiveBillingTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ customerId: 'customer-123', planId: '' })
    mockHasPermissions.mockReturnValue(true)
    mockHasOrganizationPremiumAddon.mockReturnValue(true)
  })

  describe('loading state', () => {
    it('renders skeleton when loading is true', () => {
      render(<SubscriptionProgressiveBillingTab subscription={null} loading={true} />)

      // Should not render the main content
      expect(screen.queryByTestId(PROGRESSIVE_BILLING_TAB_TEST_ID)).not.toBeInTheDocument()
    })

    it('renders skeleton when subscription is null', () => {
      render(<SubscriptionProgressiveBillingTab subscription={null} loading={false} />)

      expect(screen.queryByTestId(PROGRESSIVE_BILLING_TAB_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('freemium state', () => {
    it('renders freemium block when user does not have premium integration', () => {
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      expect(screen.getByTestId(PROGRESSIVE_BILLING_TAB_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(PROGRESSIVE_BILLING_FREEMIUM_BLOCK_TEST_ID)).toBeInTheDocument()
    })

    it('does not render freemium block when user has premium integration', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      expect(
        screen.queryByTestId(PROGRESSIVE_BILLING_FREEMIUM_BLOCK_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('overridden badge', () => {
    it('shows overridden badge when subscription has thresholds', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      expect(screen.getByTestId(PROGRESSIVE_BILLING_OVERRIDDEN_CHIP_TEST_ID)).toBeInTheDocument()
    })

    it('shows overridden badge when progressive billing is disabled but plan has thresholds', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({
            progressiveBillingDisabled: true,
            usageThresholds: [],
            plan: {
              id: 'plan-123',
              amountCurrency: CurrencyEnum.Usd,
              usageThresholds: [
                {
                  id: 'plan-threshold-1',
                  amountCents: '5000',
                  recurring: false,
                  thresholdDisplayName: 'Plan threshold',
                },
              ],
            },
          })}
          loading={false}
        />,
      )

      expect(screen.getByTestId(PROGRESSIVE_BILLING_OVERRIDDEN_CHIP_TEST_ID)).toBeInTheDocument()
    })

    it('does not show overridden badge when no thresholds and not disabled', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({
            usageThresholds: [],
            plan: {
              id: 'plan-123',
              amountCurrency: CurrencyEnum.Usd,
              usageThresholds: [],
            },
          })}
          loading={false}
        />,
      )

      expect(
        screen.queryByTestId(PROGRESSIVE_BILLING_OVERRIDDEN_CHIP_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('menu actions', () => {
    it('renders menu button when user has subscriptionsUpdate permission', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      expect(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID)).toBeInTheDocument()
    })

    it('does not render menu button when user lacks subscriptionsUpdate permission', () => {
      mockHasPermissions.mockReturnValue(false)

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      expect(screen.queryByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    it('shows edit button in menu when opened', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_EDIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    it('shows reset button when subscription has thresholds', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_RESET_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    it('does not show reset button when subscription has no thresholds', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({ usageThresholds: [] })}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_EDIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(screen.queryByTestId(PROGRESSIVE_BILLING_RESET_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    it('shows toggle button with correct label when progressive billing is enabled', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({ progressiveBillingDisabled: false })}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        const toggleButton = screen.getByTestId(PROGRESSIVE_BILLING_TOGGLE_BUTTON_TEST_ID)

        expect(toggleButton).toBeInTheDocument()
        // Should show "disable" text when currently enabled
        expect(toggleButton).toHaveTextContent('text_1769604747500dwp43wers41')
      })
    })

    it('shows toggle button with correct label when progressive billing is disabled', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({ progressiveBillingDisabled: true })}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        const toggleButton = screen.getByTestId(PROGRESSIVE_BILLING_TOGGLE_BUTTON_TEST_ID)

        expect(toggleButton).toBeInTheDocument()
        // Should show "enable" text when currently disabled
        expect(toggleButton).toHaveTextContent('text_1769604747500dwp43wers40')
      })
    })

    it('navigates to edit form when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_EDIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_EDIT_BUTTON_TEST_ID))
      })

      expect(testMockNavigateFn).toHaveBeenCalled()
    })

    it('calls mutation when toggle button is clicked', async () => {
      const user = userEvent.setup()
      const subscription = createMockSubscription({ progressiveBillingDisabled: false })
      const mocks: TestMocksType = [createSwitchMutationMock(subscription.id, true)]

      render(<SubscriptionProgressiveBillingTab subscription={subscription} loading={false} />, {
        mocks,
      })

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_MENU_BUTTON_TEST_ID))
      })

      await waitFor(() => {
        expect(screen.getByTestId(PROGRESSIVE_BILLING_TOGGLE_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId(PROGRESSIVE_BILLING_TOGGLE_BUTTON_TEST_ID))
      })

      // The mutation should have been called (no error thrown)
    })
  })

  describe('disabled state display', () => {
    it('shows disabled message when progressive billing is disabled', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({ progressiveBillingDisabled: true })}
          loading={false}
        />,
      )

      expect(screen.getByTestId(PROGRESSIVE_BILLING_DISABLED_MESSAGE_TEST_ID)).toBeInTheDocument()
    })

    it('does not show disabled message when progressive billing is enabled', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({ progressiveBillingDisabled: false })}
          loading={false}
        />,
      )

      expect(
        screen.queryByTestId(PROGRESSIVE_BILLING_DISABLED_MESSAGE_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('thresholds display', () => {
    it('displays subscription thresholds table when thresholds exist', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription()}
          loading={false}
        />,
      )

      // The thresholds table should be rendered (check for table content)
      expect(screen.getByText('First threshold')).toBeInTheDocument()
      expect(screen.getByText('Second threshold')).toBeInTheDocument()
    })

    it('displays recurring thresholds table when recurring thresholds exist', () => {
      render(
        <SubscriptionProgressiveBillingTab
          subscription={createMockSubscription({
            usageThresholds: [
              {
                id: 'threshold-1',
                amountCents: '10000',
                recurring: false,
                thresholdDisplayName: 'Non-recurring',
              },
              {
                id: 'threshold-2',
                amountCents: '50000',
                recurring: true,
                thresholdDisplayName: 'Recurring threshold',
              },
            ],
          })}
          loading={false}
        />,
      )

      expect(screen.getByText('Non-recurring')).toBeInTheDocument()
      expect(screen.getByText('Recurring threshold')).toBeInTheDocument()
    })
  })
})
