import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OverflowTabs, OverflowTabsList, OverflowTabsTrigger } from '../overflow-tabs'
import { TabsContent } from '../tabs'

describe('OverflowTabs', () => {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(240)
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width: 80,
      height: 32,
      top: 0,
      bottom: 32,
      left: 0,
      right: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))
    const getStyle = window.getComputedStyle

    jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const style = getStyle(element)

      style.paddingLeft = '4px'
      style.paddingRight = '4px'
      return style
    })
  })
  afterEach(() => jest.restoreAllMocks())

  it('selects a hidden item, moves focus to its tab, and returns the displaced tab to More', async () => {
    const user = userEvent.setup()

    render(
      <OverflowTabs defaultValue="a">
        <OverflowTabsList aria-label="Sections">
          {['a', 'b', 'c'].map((value) => (
            <OverflowTabsTrigger key={value} value={value} textValue={value}>
              {value}
            </OverflowTabsTrigger>
          ))}
        </OverflowTabsList>
        {['a', 'b', 'c'].map((value) => (
          <TabsContent key={value} value={value}>
            {value} panel
          </TabsContent>
        ))}
      </OverflowTabs>,
    )
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    await user.click(screen.getByRole('menuitem', { name: 'c' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'c' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('c panel')
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    expect(
      within(screen.getByRole('menu')).getByRole('menuitem', { name: 'a' }),
    ).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'More tabs' })).toHaveFocus()
  })
})
