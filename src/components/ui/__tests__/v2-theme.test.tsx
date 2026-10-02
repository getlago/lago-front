import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Button } from '../button'
import { Input } from '../input'
import { V2Portal, V2Theme } from '../v2-theme'

// These tests guard the opt-in boundary rather than any particular palette value.
describe('v2 color isolation', () => {
  afterEach(cleanup)

  it('opts in only descendants and preserves existing controls outside the boundary', () => {
    render(
      <>
        <Button>Outside</Button>
        <Input aria-label="Outside input" />
        <V2Theme mode="dark">
          <Button>Inside</Button>
          <Input aria-label="Inside input" />
        </V2Theme>
      </>,
    )
    expect(screen.getByText('Outside')).not.toHaveClass('v2-button')
    expect(screen.getByText('Outside')).toHaveClass('bg-primary')
    expect(screen.getByLabelText('Outside input')).not.toHaveClass('v2-input')
    expect(screen.getByText('Inside')).toHaveClass('v2-button')
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
