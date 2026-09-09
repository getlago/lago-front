import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import {
  NAVIGATION_TAB_BAR_TEST_ID,
  NavigationTabBar,
  NavigationTabBarItem,
} from '../NavigationTabBar'

const baseTabs: NavigationTabBarItem[] = [
  { title: 'Overview', link: '/customers/1/overview', dataTest: 'tab-overview' },
  { title: 'Invoices', link: '/customers/1/invoices', dataTest: 'tab-invoices' },
  { title: 'Usage', link: '/customers/1/usage', dataTest: 'tab-usage' },
]

describe('NavigationTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN tabs are provided', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the tab bar container', () => {
        render(<NavigationTabBar tabs={baseTabs} />)

        expect(screen.getByTestId(NAVIGATION_TAB_BAR_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render all visible tabs', () => {
        render(<NavigationTabBar tabs={baseTabs} />)

        const tabs = screen.getAllByRole('tab')

        expect(tabs).toHaveLength(3)
      })

      it.each([
        ['Overview tab', 'tab-overview'],
        ['Invoices tab', 'tab-invoices'],
        ['Usage tab', 'tab-usage'],
      ])('THEN should display the %s', (_, testId) => {
        render(<NavigationTabBar tabs={baseTabs} />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN some tabs are hidden', () => {
    const tabsWithHidden: NavigationTabBarItem[] = [
      { title: 'Overview', link: '/overview', dataTest: 'tab-overview' },
      { title: 'Hidden Tab', link: '/hidden', hidden: true, dataTest: 'tab-hidden' },
      { title: 'Invoices', link: '/invoices', dataTest: 'tab-invoices' },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should only render non-hidden tabs', () => {
        render(<NavigationTabBar tabs={tabsWithHidden} />)

        const tabs = screen.getAllByRole('tab')

        expect(tabs).toHaveLength(2)
        expect(screen.queryByTestId('tab-hidden')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a disabled tab', () => {
    const tabsWithDisabled: NavigationTabBarItem[] = [
      { title: 'Overview', link: '/overview', dataTest: 'tab-overview' },
      { title: 'Disabled', link: '/disabled', disabled: true, dataTest: 'tab-disabled' },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should render the disabled tab as disabled', () => {
        render(<NavigationTabBar tabs={tabsWithDisabled} />)

        expect(screen.getByTestId('tab-disabled')).toBeDisabled()
      })
    })
  })

  describe('GIVEN a tab with a link', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['tab-overview', '/customers/1/overview'],
        ['tab-invoices', '/customers/1/invoices'],
        ['tab-usage', '/customers/1/usage'],
      ])('THEN should render %s as an anchor to its target', (testId, href) => {
        render(<NavigationTabBar tabs={baseTabs} />)

        expect(screen.getByTestId(testId)).toHaveAttribute('href', href)
      })
    })

    describe('WHEN the user clicks it', () => {
      // Clicking the inner label rather than the tab root mirrors how the e2e
      // suite drives tabs: `cy.get('[role="tab"]').contains(...)` resolves to
      // the deepest element holding the text.
      it('THEN should navigate to that tab through the anchor', async () => {
        const user = userEvent.setup()

        window.history.pushState({}, '', '/customers/1/overview')

        render(<NavigationTabBar tabs={baseTabs} />)

        await user.click(screen.getByText('Invoices'))

        expect(window.location.pathname).toBe('/customers/1/invoices')
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a tab with a link and the keyboard focus', () => {
    describe('WHEN the user presses Space', () => {
      it('THEN should activate that tab', async () => {
        const user = userEvent.setup()

        window.history.pushState({}, '', '/customers/1/overview')

        render(<NavigationTabBar tabs={baseTabs} />)

        screen.getByTestId('tab-invoices').focus()
        await user.keyboard(' ')

        expect(window.location.pathname).toBe('/customers/1/invoices')
      })
    })
  })

  describe('GIVEN a disabled tab', () => {
    describe('WHEN the component renders', () => {
      it('THEN should keep it a button so it stays unfollowable', () => {
        const tabsWithDisabledLink: NavigationTabBarItem[] = [
          { title: 'Overview', link: '/overview', dataTest: 'tab-overview' },
          { title: 'Disabled', link: '/disabled', disabled: true, dataTest: 'tab-disabled' },
        ]

        render(<NavigationTabBar tabs={tabsWithDisabledLink} />)

        expect(screen.getByTestId('tab-disabled')).not.toHaveAttribute('href')
      })
    })
  })

  describe('GIVEN a custom name prop', () => {
    describe('WHEN the component renders', () => {
      it('THEN should set the aria-label on the Tabs', () => {
        render(<NavigationTabBar tabs={baseTabs} name="Customer tabs" />)

        expect(screen.getByRole('tablist', { name: 'Customer tabs' })).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the tab already matching the URL', () => {
    describe('WHEN the user clicks it', () => {
      // A plain anchor would push a duplicate history entry for the page you are on.
      it('THEN should suppress the navigation', async () => {
        const user = userEvent.setup()

        window.history.pushState({}, '', '/customers/1/overview')

        render(<NavigationTabBar tabs={baseTabs} />)

        await user.click(screen.getByTestId('tab-overview'))

        expect(window.location.pathname).toBe('/customers/1/overview')
      })
    })
  })
})
