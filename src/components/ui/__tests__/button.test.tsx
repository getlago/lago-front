import { act, cleanup, screen, waitFor } from '@testing-library/react'
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

    expect(button).toHaveClass('bg-primary')
    expect(button).toHaveClass('h-9')
  })

  it('applies the destructive variant classes instead of the default ones', async () => {
    await act(() => render(<Button variant="destructive">Delete</Button>))

    const button = screen.getByRole('button', { name: 'Delete' })

    expect(button).toHaveClass('bg-destructive')
    expect(button).not.toHaveClass('bg-primary')
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
    expect(button).toHaveClass('bg-primary')
  })

  it('lets a conflicting custom className override the variant class, via cn/tailwind-merge', async () => {
    await act(() => render(<Button className="bg-accent">Default</Button>))

    const button = screen.getByRole('button', { name: 'Default' })

    expect(button).toHaveClass('bg-accent')
    expect(button).not.toHaveClass('bg-primary')
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
    expect(link).toHaveClass('bg-primary')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('forwards the ref to the underlying button element', async () => {
    const ref = { current: null as HTMLButtonElement | null }

    await act(() => render(<Button ref={ref}>Ref target</Button>))

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Ref target' }))
  })
})
