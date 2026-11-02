import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sharedConfig from 'lago-configs/tailwind'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

import { Button } from '../button'
import { ColorTheme } from '../color-theme'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'

const Example = () => (
  <TooltipProvider>
    <ColorTheme mode="dark">
      {['Copy', 'Download'].map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button>{label}</Button>
          </TooltipTrigger>
          <TooltipContent>{label} details</TooltipContent>
        </Tooltip>
      ))}
    </ColorTheme>
  </TooltipProvider>
)

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms))

describe('Shadcn Tooltip', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    cleanup()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('waits 300ms initially, opens the next tooltip instantly, then restores the delay after 500ms', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(<Example />)
    const copy = screen.getByRole('button', { name: 'Copy' })
    const download = screen.getByRole('button', { name: 'Download' })

    await user.hover(copy)
    advance(299)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    advance(1)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy details')
    await user.unhover(copy)
    // Move out of the hover-content grace area (jsdom has zero-size rectangles).
    await user.pointer({ target: document.body, coords: { clientX: 100, clientY: 100 } })
    await user.hover(download)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Download details')
    await user.keyboard('{Escape}')
    await user.unhover(download)
    advance(501)
    await user.hover(copy)
    advance(299)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    advance(1)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy details')
  })

  it('does not skip the delay when passing icons before any tooltip has opened', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(<Example />)
    await user.hover(screen.getByRole('button', { name: 'Copy' }))
    advance(100)
    await user.unhover(screen.getByRole('button', { name: 'Copy' }))
    await user.hover(screen.getByRole('button', { name: 'Download' }))
    advance(299)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    advance(1)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Download details')
  })

  it('opens immediately for keyboard focus, preserves portal theme, and dismisses with Escape or activation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    const { container } = render(<Example />)

    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy details')
    const content = document.querySelector('.v2-tooltip')

    expect(content).toHaveAttribute('data-color-theme', 'dark')
    expect(container).not.toContainElement(content as HTMLElement)
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Download details')
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

it.each(['drawer', 'dialog'])('renders portalled content above the %s layer', async (layer) => {
  const { container } = render(
    <div className={`z-${layer}`}>
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Details</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>,
  )
  const content = document.querySelector('.v2-tooltip') as HTMLElement
  const overlay = container.firstElementChild as HTMLElement
  const result = await postcss([
    tailwindcss({
      presets: [sharedConfig],
      content: [{ raw: `${content.className} ${overlay.className}`, extension: 'html' }],
      corePlugins: { preflight: false },
    }),
  ]).process('@tailwind utilities;', { from: undefined })
  const style = document.createElement('style')

  style.textContent = result.css
  document.head.appendChild(style)
  try {
    expect(container).not.toContainElement(content)
    expect(getComputedStyle(content).zIndex).toBe('2400')
    expect(Number(getComputedStyle(content).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(overlay).zIndex),
    )
  } finally {
    style.remove()
  }
})
