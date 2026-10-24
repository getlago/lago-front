import { screen, within } from '@testing-library/react'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { shadcnButtonTab } from '../ButtonTest'

describe('Shadcn button tab', () => {
  it('selects the button panel when its URL is opened directly', () => {
    window.history.pushState({}, '', shadcnButtonTab.link)

    render(
      <NavigationTab
        tabs={[
          { title: 'Other', link: '/design-system/other', component: <div>Other panel</div> },
          shadcnButtonTab,
        ]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Shadcn-button' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('region', { name: 'Shadcn button showcase' }),
    ).toBeVisible()
    expect(screen.queryByText('Other panel')).not.toBeInTheDocument()
  })
})
