import { Menu } from '@base-ui/react/menu'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { useRender } from '@base-ui/react/use-render'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, forwardRef, HTMLAttributes, ReactElement, useRef, useState } from 'react'

const Composed = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { child: ReactElement }>(
  ({ child, ...props }, ref) => useRender({ render: child, ref, props }),
)

Composed.displayName = 'Composed'

it('composes child and owner refs and handlers without adding a host', () => {
  const childRef = createRef<HTMLAnchorElement>()
  const ownerRef = createRef<HTMLElement>()
  const childClick = jest.fn()
  const ownerClick = jest.fn()
  const { container } = render(
    <Composed
      ref={ownerRef}
      onClick={ownerClick}
      child={
        <a href="#target" ref={childRef} onClick={childClick}>
          Target
        </a>
      }
    />,
  )
  const link = screen.getByRole('link')

  expect(container.children).toHaveLength(1)
  expect(childRef.current).toBe(link)
  expect(ownerRef.current).toBe(link)
  fireEvent.click(link)
  expect(childClick).toHaveBeenCalledTimes(1)
  expect(ownerClick).toHaveBeenCalledTimes(1)
})

const MixedMenu = ({ onChange }: { onChange: (checked: boolean) => void }): JSX.Element => {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
  const canceledEvent = useRef<Event>()

  return (
    <Menu.Root
      onOpenChange={(open, details) => {
        if (!open && details.reason === 'item-press' && canceledEvent.current === details.event)
          details.cancel()
      }}
    >
      <Menu.Trigger>Options</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.CheckboxItem
              checked={checked === true}
              aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
              closeOnClick
              onClick={(event) => {
                canceledEvent.current = event.nativeEvent
              }}
              onCheckedChange={(next) => {
                setChecked(next)
                onChange(next)
              }}
            >
              Columns
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

it.each(['pointer', 'keyboard'])(
  'preserves mixed state, toggles once and cancels only dismissal with %s',
  async (interaction) => {
    const user = userEvent.setup()
    const change = jest.fn()

    render(<MixedMenu onChange={change} />)
    await user.click(screen.getByRole('button', { name: 'Options' }))
    const item = await screen.findByRole('menuitemcheckbox', { name: 'Columns' })

    expect(item).toHaveAttribute('aria-checked', 'mixed')
    if (interaction === 'pointer') await user.click(item)
    else {
      act(() => item.focus())
      await user.keyboard('{Enter}')
    }
    expect(item).toHaveAttribute('aria-checked', 'true')
    expect(change).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalledWith(true)
    expect(screen.getByRole('menu')).toBeVisible()
  },
)

it('supports a 300ms shared tooltip delay and immediate keyboard opening', async () => {
  jest.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

  try {
    render(
      <BaseTooltip.Provider delay={300} timeout={500}>
        <BaseTooltip.Root>
          <BaseTooltip.Trigger>Help</BaseTooltip.Trigger>
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner>
              <BaseTooltip.Popup role="tooltip">Details</BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        </BaseTooltip.Root>
      </BaseTooltip.Provider>,
    )
    await user.hover(screen.getByRole('button', { name: 'Help' }))
    act(() => jest.advanceTimersByTime(299))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Details')
    await user.keyboard('{Escape}')
    await user.unhover(screen.getByRole('button', { name: 'Help' }))
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Details')
  } finally {
    jest.useRealTimers()
  }
})
