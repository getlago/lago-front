import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { Button } from '../button'
import { ColorTheme } from '../color-theme'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu'

const Example = ({ onAction = jest.fn() }: { onAction?: () => void }): JSX.Element => {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
  const [sort, setSort] = useState('new')

  return (
    <ColorTheme mode="dark">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onAction}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled onSelect={onAction}>
            Unavailable
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
            Archived
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuRadioItem value="new">Newest</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="old">Oldest</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Folders</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={onAction}>Finance</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </ColorTheme>
  )
}

const openKeyboard = async (): Promise<ReturnType<typeof userEvent.setup>> => {
  const user = userEvent.setup()

  await user.tab()
  await user.keyboard('{Enter}')
  await screen.findByRole('menu')

  return user
}

describe('Shadcn DropdownMenu', () => {
  it('preserves link items rendered with asChild', async () => {
    const onSelect = jest.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild onSelect={onSelect}>
            <a href="#details">View details</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    const user = await openKeyboard()
    const item = screen.getByRole('menuitem', { name: 'View details' })

    expect(item.tagName).toBe('A')
    expect(item).toHaveAttribute('href', '#details')
    await waitFor(() => expect(item).toHaveFocus())
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('keeps conditional text together and preserves zero', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            {'Items '}
            {false}
            {null}
            {0}
            {' remaining'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    const item = screen.getByRole('menuitem', { name: 'Items 0 remaining' })

    expect(item.children).toHaveLength(1)
    expect(item.firstElementChild).toHaveTextContent('Items 0 remaining')
  })

  it('supports slotted selection items and submenu triggers with indicators', async () => {
    const onCheckedChange = jest.fn()
    const onValueChange = jest.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem asChild checked onCheckedChange={onCheckedChange}>
            <button>Archived</button>
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="new" onValueChange={onValueChange}>
            <DropdownMenuRadioItem asChild value="new">
              <button>Newest</button>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem asChild value="old">
              <button>Oldest</button>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger asChild>
              <button>Folders</button>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Finance</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    const user = await openKeyboard()
    const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Archived' })
    const radio = screen.getByRole('menuitemradio', { name: 'Newest' })
    const trigger = screen.getByRole('menuitem', { name: 'Folders' })

    for (const item of [checkbox, radio, trigger]) {
      expect(item.tagName).toBe('BUTTON')
      expect(item.querySelector('svg')).toBeInTheDocument()
    }
    await user.keyboard('{Enter}')
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('old')
    await user.keyboard('{End}{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Finance' })).toHaveFocus())
  })

  it('opens from the keyboard, skips disabled items and restores focus on Escape', async () => {
    render(<Example />)
    const user = await openKeyboard()

    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitemcheckbox')).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus()
  })

  it('runs an action once and closes the menu', async () => {
    const onAction = jest.fn()

    render(<Example onAction={onAction} />)
    const user = await openKeyboard()

    await user.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('keeps checkbox and radio selections open, with mixed-state support', async () => {
    render(<Example />)
    const user = await openKeyboard()
    const checkbox = screen.getByRole('menuitemcheckbox')

    expect(checkbox).toHaveAttribute('aria-checked', 'mixed')
    await user.click(checkbox)
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menu')).toBeVisible()
    await user.click(screen.getByRole('menuitemradio', { name: 'Oldest' }))
    expect(screen.getByRole('menuitemradio', { name: 'Oldest' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Newest' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('menu')).toBeVisible()
  })

  it('preserves dark theme in both portals and supports submenu keyboard navigation', async () => {
    const { container } = render(<Example />)
    const user = await openKeyboard()
    const root = screen.getByRole('menu')

    expect(root).toHaveAttribute('data-color-theme', 'dark')
    expect(container).not.toContainElement(root)
    await user.keyboard('{End}{ArrowRight}')
    const finance = await screen.findByRole('menuitem', { name: 'Finance' })

    await waitFor(() => expect(finance).toHaveFocus())
    expect(finance.closest('[role="menu"]')).toHaveAttribute('data-color-theme', 'dark')
    await user.keyboard('{ArrowLeft}')
    await waitFor(() =>
      expect(screen.queryByRole('menuitem', { name: 'Finance' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('menuitem', { name: 'Folders' })).toHaveFocus()
  })

  it('ignores disabled actions even if a click is dispatched', async () => {
    const onAction = jest.fn()

    render(<Example onAction={onAction} />)
    await openKeyboard()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unavailable' }))
    expect(onAction).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeVisible()
  })

  it('allows selection items to opt into closing', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem closeOnSelect>Close after selection</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await userEvent.click(screen.getByRole('menuitemcheckbox'))
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })
})
