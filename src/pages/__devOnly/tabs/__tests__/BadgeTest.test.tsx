import { screen, within } from '@testing-library/react'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { shadcnBadgeTab } from '../BadgeTest'

describe('Shadcn badge tab', () => {
  it('selects the badge panel when its URL is opened directly', () => {
    window.history.pushState({}, '', shadcnBadgeTab.link)

    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnBadgeTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-badge' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('region', { name: 'Shadcn badge showcase' }),
    ).toBeVisible()
    expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
  })
})
