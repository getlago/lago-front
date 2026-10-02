import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Button } from '../button'
import { Input } from '../input'
import { V2Portal, V2Theme } from '../v2-theme'

// Shadcn defaults to v2; legacy and native controls do not opt in.
describe('v2 color isolation', () => {
  afterEach(cleanup)

  it('defaults shadcn to light and inherits dark without marking native controls', () => {
    render(
      <>
        <button>Native control</button>
        <Button>Outside</Button>
        <Input aria-label="Outside input" />
        <V2Theme mode="dark">
          <Button>Inside</Button>
          <Input aria-label="Inside input" />
        </V2Theme>
      </>,
    )
    expect(screen.getByText('Outside')).toHaveClass('v2-theme', 'v2-button')
    expect(screen.getByText('Outside')).toHaveAttribute('data-theme', 'light')
    expect(screen.getByText('Native control')).not.toHaveClass('v2-theme')
    expect(screen.getByText('Outside')).toHaveClass('bg-primary')
    expect(screen.getByLabelText('Outside input')).toHaveClass('v2-theme', 'v2-input')
    expect(screen.getByLabelText('Outside input')).toHaveAttribute('data-theme', 'light')
    expect(screen.getByText('Inside')).toHaveClass('v2-button')
    expect(screen.getByText('Inside')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByLabelText('Inside input')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByLabelText('Inside input')).toHaveClass('v2-input')
    expect(document.body).not.toHaveClass('v2-theme')
  })

  it('carries mode into a portal and updates it without changing the document theme', () => {
    const view = render(
      <V2Theme mode="light">
        <V2Portal>
          <Button>Portalled</Button>
        </V2Portal>
      </V2Theme>,
    )

    expect(screen.getByText('Portalled').closest('.v2-theme')).toHaveAttribute(
      'data-theme',
      'light',
    )
    view.rerender(
      <V2Theme mode="dark">
        <V2Portal>
          <Button>Portalled</Button>
        </V2Portal>
      </V2Theme>,
    )
    expect(screen.getByText('Portalled').closest('.v2-theme')).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).not.toHaveClass('dark')
    view.unmount()
    expect(screen.queryByText('Portalled')).not.toBeInTheDocument()
  })

  it('preserves disabled behavior in the new theme', () => {
    const onClick = jest.fn()

    render(
      <V2Theme mode="light">
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      </V2Theme>,
    )
    fireEvent.click(screen.getByText('Disabled'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
