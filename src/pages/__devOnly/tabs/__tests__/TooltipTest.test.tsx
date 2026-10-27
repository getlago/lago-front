import { screen, within } from '@testing-library/react'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { shadcnTooltipTab } from '../TooltipTest'

describe('Shadcn tooltip tab', () => {
  it('selects the tooltip panel when its URL is opened directly', () => {
    window.history.pushState({}, '', shadcnTooltipTab.link)

    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnTooltipTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-tooltip' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('region', { name: 'Shadcn tooltip showcase' }),
    ).toBeVisible()
    expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
  })
})
