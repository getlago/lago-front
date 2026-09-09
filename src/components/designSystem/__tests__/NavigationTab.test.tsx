import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import { NavigationTab, TabManagedBy } from '../NavigationTab'

const urlTabs = [
  { title: 'Overview', link: '/customers/1/overview', dataTest: 'tab-overview' },
  { title: 'Invoices', link: '/customers/1/invoices', dataTest: 'tab-invoices' },
]

const indexTabs = [
  { title: 'First', component: <div>first panel</div>, dataTest: 'tab-first' },
  { title: 'Second', component: <div>second panel</div>, dataTest: 'tab-second' },
]

describe('NavigationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.pushState({}, '', '/customers/1/overview')
  })

  describe('GIVEN URL-managed tabs', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['tab-overview', '/customers/1/overview'],
        ['tab-invoices', '/customers/1/invoices'],
      ])('THEN should render %s as an anchor to its target', (testId, href) => {
        render(<NavigationTab tabs={urlTabs} />)

        expect(screen.getByTestId(testId)).toHaveAttribute('href', href)
      })
    })

    describe('WHEN the user clicks another tab', () => {
      // Clicking the inner label rather than the tab root mirrors how the e2e
      // suite drives tabs: `cy.get('[role="tab"]').contains(...)` resolves to
      // the deepest element holding the text.
      it('THEN should navigate to that tab through the anchor', async () => {
        const user = userEvent.setup()

        render(<NavigationTab tabs={urlTabs} />)

        await user.click(screen.getByText('Invoices'))

        expect(window.location.pathname).toBe('/customers/1/invoices')
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the user presses Space on another tab', () => {
      it('THEN should navigate to that tab', async () => {
        const user = userEvent.setup()

        render(<NavigationTab tabs={urlTabs} />)

        screen.getByTestId('tab-invoices').focus()
        await user.keyboard(' ')

        expect(window.location.pathname).toBe('/customers/1/invoices')
      })
    })

    describe('WHEN the user cmd-clicks another tab', () => {
      // MUI fires Tabs.onChange before the tab's own onClick. The browser owns a
      // modified click, so the consumer must not be told the tab changed.
      it('THEN should not report a tab change', () => {
        const onChange = jest.fn()

        render(<NavigationTab tabs={urlTabs} onChange={onChange} />)

        fireEvent.click(screen.getByText('Invoices'), { metaKey: true })

        expect(onChange).not.toHaveBeenCalled()
      })

      it('THEN should still report a plain click', () => {
        const onChange = jest.fn()

        render(<NavigationTab tabs={urlTabs} onChange={onChange} />)

        fireEvent.click(screen.getByText('Invoices'))

        expect(onChange).toHaveBeenCalledWith(1)
      })
    })

    describe('WHEN the user clicks the tab already matching the URL', () => {
      afterEach(() => {
        jest.restoreAllMocks()
      })

      // The pathname cannot see the guard: react-router replaces an identical
      // target, so the URL is unchanged with or without it. Whether history was
      // touched at all is the only observable difference.
      it('THEN should not touch history at all', async () => {
        const user = userEvent.setup()

        render(<NavigationTab tabs={urlTabs} />)

        const pushState = jest.spyOn(window.history, 'pushState')
        const replaceState = jest.spyOn(window.history, 'replaceState')

        await user.click(screen.getByTestId('tab-overview'))

        expect(pushState).not.toHaveBeenCalled()
        expect(replaceState).not.toHaveBeenCalled()
        expect(window.location.pathname).toBe('/customers/1/overview')
      })
    })

    describe('WHEN a tab is disabled', () => {
      it('THEN should keep it a button so it stays unfollowable', () => {
        render(
          <NavigationTab
            tabs={[
              urlTabs[0],
              { title: 'Usage', link: '/customers/1/usage', disabled: true, dataTest: 'tab-usage' },
            ]}
          />,
        )

        expect(screen.getByTestId('tab-usage')).not.toHaveAttribute('href')
        expect(screen.getByTestId('tab-usage')).toBeDisabled()
      })
    })
  })

  describe('GIVEN index-managed tabs', () => {
    describe('WHEN the user clicks a tab', () => {
      it('THEN should swap the panel without rendering an anchor', async () => {
        const user = userEvent.setup()

        render(<NavigationTab managedBy={TabManagedBy.INDEX} tabs={indexTabs} />)

        expect(screen.getByTestId('tab-first')).not.toHaveAttribute('href')
        expect(screen.getByText('first panel')).toBeInTheDocument()

        await user.click(screen.getByTestId('tab-second'))

        expect(screen.getByText('second panel')).toBeInTheDocument()
      })
    })

    describe('WHEN the user shift-clicks another tab', () => {
      // A button tab has no browser default to defer to: the panel swaps, so the
      // consumer must still learn which tab is active.
      it('THEN should still report the tab change', () => {
        const onChange = jest.fn()

        render(
          <NavigationTab managedBy={TabManagedBy.INDEX} tabs={indexTabs} onChange={onChange} />,
        )

        fireEvent.click(screen.getByText('Second'), { shiftKey: true })

        expect(onChange).toHaveBeenCalledWith(1)
      })
    })
  })
})
