import { render, screen } from '@testing-library/react'
import { CircleCheck } from 'lucide-react'
import { createRef } from 'react'

import { Badge } from '../badge'

describe('Badge', () => {
  it('renders static text and forwards its span ref and attributes', () => {
    const ref = createRef<HTMLSpanElement>()
    render(
      <Badge ref={ref} title="Payment state" data-testid="badge">
        Active
      </Badge>,
    )
    const badge = screen.getByText('Active')
    expect(ref.current).toBe(badge)
    expect(badge.tagName).toBe('SPAN')
    expect(badge).toHaveAttribute('title', 'Payment state')
    expect(badge).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps decorative icons hidden while preserving the visible label', () => {
    render(
      <Badge variant="success" size="sm">
        <CircleCheck aria-hidden="true" data-testid="icon" strokeWidth={2} />
        Active
      </Badge>,
    )
    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('icon')).toHaveAttribute('stroke-width', '2')
  })

  it('does not treat the disabled tone as an inactive control', () => {
    render(<Badge variant="disabled">Archived</Badge>)
    expect(screen.getByText('Archived')).not.toHaveAttribute('disabled')
    expect(screen.getByText('Archived')).not.toHaveAttribute('aria-disabled')
  })

  it('allows caller utility overrides without conflicting defaults', () => {
    render(
      <Badge size="sm" variant="info" className="h-8 bg-surface text-text-default">
        Custom
      </Badge>,
    )
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('h-8', 'bg-surface', 'text-text-default')
    expect(badge).not.toHaveClass('h-5', 'bg-info', 'text-info-foreground')
  })
})
