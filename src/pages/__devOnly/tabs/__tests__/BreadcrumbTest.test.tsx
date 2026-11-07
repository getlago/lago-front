import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { CollapsedBreadcrumbExample, shadcnBreadcrumbTab } from '../BreadcrumbTest'

describe('V2 Breadcrumb', () => {
  it('opens its direct showcase URL and exposes ordered trails and current pages', () => {
    window.history.pushState({}, '', shadcnBreadcrumbTab.link)
    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnBreadcrumbTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-breadcrumb' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const trail = screen.getAllByRole('navigation', { name: 'Full breadcrumb' })[0]
    expect(within(trail).getByRole('list')).toBeVisible()
    expect(within(trail).getAllByRole('listitem')).toHaveLength(4)
    expect(within(trail).getAllByRole('link')).toHaveLength(3)
    expect(within(trail).getByText('Invoice 001')).toHaveAttribute('aria-current', 'page')
    expect(within(trail).queryByRole('link', { name: 'Invoice 001' })).not.toBeInTheDocument()
    expect(within(trail).queryByRole('button')).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('navigation', { name: 'Single breadcrumb' })[0],
    ).not.toHaveTextContent('Show hidden ancestors')
  })

  it('opens hidden ancestors in order and restores focus on Escape', async () => {
    render(<CollapsedBreadcrumbExample />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Show hidden ancestors' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Acme', 'Subscriptions'])
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Acme' })).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('navigates a hidden ancestor with the keyboard and closes the shared menu', async () => {
    render(<CollapsedBreadcrumbExample />)
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Show hidden ancestors' }).focus()
    await user.keyboard('{Enter}')
    const ancestor = await screen.findByRole('menuitem', { name: 'Acme' })
    expect(ancestor.tagName).toBe('A')
    expect(ancestor).toHaveAttribute('href', `${shadcnBreadcrumbTab.link}#acme`)
    await waitFor(() => expect(ancestor).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(window.location.hash).toBe('#acme')
  })
})
