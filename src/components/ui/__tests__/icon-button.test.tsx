import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Copy } from 'lucide-react'
import { createRef } from 'react'

import { IconButton } from '../icon-button'
import { TooltipProvider } from '../tooltip'

describe('IconButton', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    cleanup()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('uses the label for its accessible name and tooltip, forwards ref and activation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const ref = createRef<HTMLButtonElement>()
    const onClick = jest.fn()

    render(
      <TooltipProvider>
        <IconButton label="Copy invoice number" ref={ref} onClick={onClick}>
          <Copy aria-hidden="true" />
        </IconButton>
      </TooltipProvider>,
    )
    const button = screen.getByRole('button', { name: 'Copy invoice number' })

    expect(ref.current).toBe(button)
    expect(button).toHaveAttribute('type', 'button')
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy invoice number')
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shares the provider timing across icon buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(
      <TooltipProvider>
        {['Copy', 'Download'].map((label) => (
          <IconButton key={label} label={label}>
            <Copy aria-hidden="true" />
          </IconButton>
        ))}
      </TooltipProvider>,
    )
    const copy = screen.getByRole('button', { name: 'Copy' })

    await user.hover(copy)
    act(() => jest.advanceTimersByTime(299))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => jest.advanceTimersByTime(1))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy')
    await user.unhover(copy)
    await user.pointer({ target: document.body, coords: { clientX: 100, clientY: 100 } })
    await user.hover(screen.getByRole('button', { name: 'Download' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Download')
  })

  it.each(['disabled', 'loading'] as const)(
    'preserves blocked activation and the accessible name while %s',
    async (state) => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const onClick = jest.fn()

      render(
        <TooltipProvider>
          <IconButton label="Copy" {...{ [state]: true }} onClick={onClick}>
            <Copy aria-hidden="true" />
          </IconButton>
        </TooltipProvider>,
      )
      const button = screen.getByRole('button', { name: 'Copy' })

      expect(button).toBeDisabled()
      if (state === 'loading') expect(button).toHaveAttribute('aria-busy', 'true')
      await user.click(button)
      expect(onClick).not.toHaveBeenCalled()
    },
  )
})
