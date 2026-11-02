import { screen, within } from '@testing-library/react'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { shadcnDropdownMenuTab } from '../DropdownMenuTest'

describe('Shadcn dropdown-menu tab', () => {
  it('selects the dropdown-menu panel when its URL is opened directly', () => {
    window.history.pushState({}, '', shadcnDropdownMenuTab.link)

    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnDropdownMenuTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-dropdown-menu' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('region', {
        name: 'Shadcn dropdown menu showcase',
      }),
    ).toBeVisible()
    expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
  })
})
