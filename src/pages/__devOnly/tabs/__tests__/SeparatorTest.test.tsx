import { screen, within } from '@testing-library/react'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { shadcnSeparatorTab } from '../SeparatorTest'

describe('Shadcn separator tab', () => {
  it('selects the separator panel when its URL is opened directly', () => {
    window.history.pushState({}, '', shadcnSeparatorTab.link)

    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnSeparatorTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-separator' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('region', {
        name: 'Shadcn separator showcase',
      }),
    ).toBeVisible()
    expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
  })
})
