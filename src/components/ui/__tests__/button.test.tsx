import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { Button } from '../button'

describe('Button', () => {
  afterEach(cleanup)

  it('renders as a native button by default', async () => {
    await act(() => render(<Button>Click me</Button>))

    const button = screen.getByRole('button', { name: 'Click me' })

    expect(button.tagName).toBe('BUTTON')
  })

  it('applies the default variant and size classes', async () => {
    await act(() => render(<Button>Default</Button>))

    const button = screen.getByRole('button', { name: 'Default' })

    expect(button).toHaveClass('bg-[var(--v2-button-background)]')
    expect(button).toHaveClass('h-9')
  })

  it('applies the destructive variant classes instead of the default ones', async () => {
    await act(() => render(<Button variant="destructive">Delete</Button>))

    const button = screen.getByRole('button', { name: 'Delete' })

    expect(button).toHaveAttribute('data-variant', 'destructive')
    expect(button).toHaveClass('bg-[var(--v2-button-background)]')
  })

  it('applies the requested size classes', async () => {
    await act(() => render(<Button size="lg">Large</Button>))

    const button = screen.getByRole('button', { name: 'Large' })

    expect(button).toHaveClass('h-10')
    expect(button).not.toHaveClass('h-9')
  })

  it('merges a custom className without losing the variant classes', async () => {
    await act(() => render(<Button className="mt-4">Default</Button>))

    const button = screen.getByRole('button', { name: 'Default' })

    expect(button).toHaveClass('mt-4')
    expect(button).toHaveClass('bg-[var(--v2-button-background)]')
  })

  it('lets a conflicting custom className override the variant class, via cn/tailwind-merge', async () => {
    await act(() => render(<Button className="bg-accent">Default</Button>))

    const button = screen.getByRole('button', { name: 'Default' })

    expect(button).toHaveClass('bg-accent')
    expect(button).not.toHaveClass('bg-[var(--v2-button-background)]')
  })

  it('disables the button and blocks the click handler', async () => {
    const onClick = jest.fn()

    await act(() =>
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>,
      ),
    )

    const button = screen.getByRole('button', { name: 'Disabled' })

    expect(button).toBeDisabled()

    await waitFor(() => userEvent.click(button))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires the click handler when enabled', async () => {
    const onClick = jest.fn()

    await act(() => render(<Button onClick={onClick}>Enabled</Button>))

    await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Enabled' })))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders the child element instead of a button when asChild is set', async () => {
    await act(() =>
      render(
        <Button asChild>
          <a href="/somewhere">Go</a>
        </Button>,
      ),
    )

    const link = screen.getByRole('link', { name: 'Go' })

    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/somewhere')
    expect(link).toHaveClass('bg-[var(--v2-button-background)]')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('forwards the ref to the underlying button element', async () => {
    const ref = { current: null as HTMLButtonElement | null }

    await act(() => render(<Button ref={ref}>Ref target</Button>))

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Ref target' }))
  })
})

describe('v2 loading and composition', () => {
  afterEach(cleanup)

  it('preserves the accessible name and content while loading, and prevents activation', async () => {
    const onClick = jest.fn()
    const { rerender } = render(<Button onClick={onClick}>Save changes</Button>)

    rerender(
      <Button onClick={onClick} loading>
        Save changes
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Save changes' })

    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(screen.getByText('Save changes')).toHaveClass('opacity-0')
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    rerender(<Button onClick={onClick}>Save changes</Button>)
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it.each(['disabled', 'loading'] as const)(
    'blocks child and parent handlers on %s anchors',
    async (state) => {
      const parent = jest.fn()
      const child = jest.fn()
      const capture = jest.fn()

      render(
        <Button asChild {...{ [state]: true }} onClick={parent}>
          <a href="#destination" onClick={child} onClickCapture={capture}>
            Navigate
          </a>
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'Navigate' })

      expect(link).toHaveAttribute('aria-disabled', 'true')
      await userEvent.click(link)
      link.focus()
      await userEvent.keyboard('{Enter}')
      expect(parent).not.toHaveBeenCalled()
      expect(child).not.toHaveBeenCalled()
      expect(capture).not.toHaveBeenCalled()
    },
  )

  it('composes enabled child and parent handlers and keeps link semantics', async () => {
    const parent = jest.fn()
    const child = jest.fn((event) => event.preventDefault())

    render(
      <Button asChild>
        <a href="#destination" onClick={child} onClickCapture={parent}>
          Navigate
        </a>
      </Button>,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Navigate' }))
    expect(parent).toHaveBeenCalledTimes(1)
    expect(child).toHaveBeenCalledTimes(1)
  })

  it('does not submit forms unless explicitly requested', async () => {
    const submit = jest.fn((event) => event.preventDefault())

    render(
      <form onSubmit={submit}>
        <Button>Action</Button>
        <Button type="submit">Submit</Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(submit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('retains icon-only labels during loading', () => {
    render(
      <Button size="icon-sm" loading aria-label="Copy">
        <svg aria-hidden="true" />
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Button event composition', () => {
  it.each([false, true])(
    'forwards enabled capture and context handlers with asChild=%s',
    (asChild) => {
      const parentClick = jest.fn()
      const parentAux = jest.fn()
      const parentKey = jest.fn()
      const parentContext = jest.fn()
      const childClick = jest.fn()
      const childAux = jest.fn()
      const childKey = jest.fn()

      render(
        <Button
          asChild={asChild}
          onClickCapture={parentClick}
          onAuxClickCapture={parentAux}
          onKeyDownCapture={parentKey}
          onContextMenu={parentContext}
        >
          {asChild ? (
            <a
              href="#target"
              onClickCapture={childClick}
              onAuxClickCapture={childAux}
              onKeyDownCapture={childKey}
            >
              Action
            </a>
          ) : (
            'Action'
          )}
        </Button>,
      )
      const target = screen.getByRole(asChild ? 'link' : 'button', { name: 'Action' })

      fireEvent.click(target)
      fireEvent(target, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }))
      fireEvent.keyDown(target, { key: 'Enter' })
      fireEvent.contextMenu(target)

      for (const handler of [parentClick, parentAux, parentKey, parentContext]) {
        expect(handler).toHaveBeenCalledTimes(1)
      }
      for (const handler of [childClick, childAux, childKey]) {
        expect(handler).toHaveBeenCalledTimes(asChild ? 1 : 0)
      }
    },
  )

  it.each(['disabled', 'loading'] as const)(
    'prevents alternative anchor activation while %s but preserves navigation keys',
    (state) => {
      const parentAux = jest.fn()
      const childAux = jest.fn()
      const parentKey = jest.fn()
      const childKey = jest.fn()
      const contextMenu = jest.fn()

      render(
        <Button
          asChild
          {...{ [state]: true }}
          onAuxClickCapture={parentAux}
          onKeyDownCapture={parentKey}
          onContextMenu={contextMenu}
        >
          <a href="#target" onAuxClickCapture={childAux} onKeyDownCapture={childKey}>
            Action
          </a>
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'Action' })
      const auxiliary = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })

      expect(fireEvent(link, auxiliary)).toBe(false)
      expect(fireEvent.keyDown(link, { key: ' ' })).toBe(false)
      expect(fireEvent.contextMenu(link)).toBe(false)
      expect(parentAux).not.toHaveBeenCalled()
      expect(childAux).not.toHaveBeenCalled()
      expect(parentKey).not.toHaveBeenCalled()
      expect(childKey).not.toHaveBeenCalled()
      expect(contextMenu).not.toHaveBeenCalled()

      expect(fireEvent.keyDown(link, { key: 'Tab' })).toBe(true)
      expect(parentKey).toHaveBeenCalledTimes(1)
      expect(childKey).toHaveBeenCalledTimes(1)
    },
  )
})
