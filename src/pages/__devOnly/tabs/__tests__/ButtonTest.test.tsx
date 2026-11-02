import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { render } from '~/test-utils'

import { ButtonTest, shadcnButtonTab } from '../ButtonTest'

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

it('counts text and icon actions and blocks them while showcasing loading', async () => {
  const user = userEvent.setup()

  render(<ButtonTest />)
  const textAction = screen.getAllByRole('button', { name: 'sm button' })[0]
  const iconAction = screen.getAllByRole('button', { name: 'Copy, icon-sm' })[0]

  await user.click(textAction)
  await user.click(iconAction)
  expect(screen.getByRole('status')).toHaveTextContent('Actions completed: 2')

  await user.click(screen.getByRole('checkbox', { name: /Show loading/ }))
  expect(textAction).toBeDisabled()
  expect(iconAction).toBeDisabled()
  await user.click(textAction)
  expect(screen.getByRole('status')).toHaveTextContent('Actions completed: 2')

  await user.click(screen.getByRole('checkbox', { name: /Show loading/ }))
  expect(textAction).toBeEnabled()
  await user.click(textAction)
  expect(screen.getByRole('status')).toHaveTextContent('Actions completed: 3')
})
