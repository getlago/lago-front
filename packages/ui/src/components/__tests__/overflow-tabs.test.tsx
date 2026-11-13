import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OverflowTabs, OverflowTabsList, OverflowTabsTrigger } from '../overflow-tabs'
import { TabsContent, TabsCounter } from '../tabs'

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

  it('announces counters and respects explicit accessible labels in tabs and More', async () => {
    const user = userEvent.setup()

    render(
      <OverflowTabs defaultValue="invoices">
        <OverflowTabsList>
          <OverflowTabsTrigger value="invoices" textValue="Invoices">
            Invoices <TabsCounter value={12} />
          </OverflowTabsTrigger>
          <OverflowTabsTrigger value="payments" textValue="Payments">
            Payments <TabsCounter value={5} />
          </OverflowTabsTrigger>
          <OverflowTabsTrigger value="settings" textValue="Settings" aria-label="Account settings">
            Settings
          </OverflowTabsTrigger>
        </OverflowTabsList>
      </OverflowTabs>,
    )
    expect(screen.getByRole('tab', { name: 'Invoices 12' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    expect(screen.getByRole('menuitem', { name: 'Payments 5' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Account settings' }))
    expect(screen.getByRole('tab', { name: 'Account settings' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    await user.click(screen.getByRole('menuitem', { name: 'Payments 5' }))
    expect(screen.getByRole('tab', { name: 'Payments 5' })).toHaveFocus()
  })

  it('keeps More closed after widening to fit all tabs and narrowing again', async () => {
    const user = userEvent.setup()
    const width = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    let resize: () => void = () => {}

    jest.spyOn(globalThis, 'ResizeObserver').mockImplementation((callback) => {
      const observer: ResizeObserver = {
        observe: (element): void => {
          if (element.classList.contains('w-full')) resize = (): void => callback([], observer)
        },
        unobserve: (element): void => {
          if (element.classList.contains('w-full')) resize = (): void => callback([], observer)
        },
        disconnect: jest.fn(),
      }

      return observer
    })
    render(
      <OverflowTabs defaultValue="a">
        <OverflowTabsList>
          {['a', 'b', 'c'].map((value) => (
            <OverflowTabsTrigger key={value} value={value} textValue={value}>
              {value}
            </OverflowTabsTrigger>
          ))}
        </OverflowTabsList>
      </OverflowTabs>,
    )
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    width.mockReturnValue(1024)
    act(resize)
    expect(screen.queryByRole('button', { name: 'More tabs' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    screen.getByRole('tab', { name: 'a' }).focus()

    width.mockReturnValue(240)
    act(resize)
    expect(screen.getByRole('button', { name: 'More tabs' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'a' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'More tabs' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('includes caller sizing classes when deciding which tabs fit', () => {
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(340)
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('px-10') ? 200 : 80

      return {
        width,
        height: 32,
        top: 0,
        bottom: 32,
        left: 0,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }
    })
    render(
      <OverflowTabs defaultValue="a">
        <OverflowTabsList>
          <OverflowTabsTrigger value="a" textValue="A" className="px-10">
            A
          </OverflowTabsTrigger>
          <OverflowTabsTrigger value="b" textValue="B">
            B
          </OverflowTabsTrigger>
          <OverflowTabsTrigger value="c" textValue="C">
            C
          </OverflowTabsTrigger>
        </OverflowTabsList>
      </OverflowTabs>,
    )
    expect(screen.getByRole('tab', { name: 'A' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'B' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More tabs' })).toBeInTheDocument()
  })

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
