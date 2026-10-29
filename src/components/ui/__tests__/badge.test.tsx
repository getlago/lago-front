import { render, screen } from '@testing-library/react'
import { CircleCheck } from 'lucide-react'
import { createRef } from 'react'

import { Badge } from '../badge'

describe('Badge', () => {
  it('renders static text and forwards its span ref and attributes', () => {
    const ref = createRef<HTMLSpanElement>()
    render(
      <Badge ref={ref} title="Payment state">
        Active
      </Badge>,
    )
    const badge = screen.getByText('Active').parentElement
    expect(ref.current).toBe(badge)
    expect(badge?.tagName).toBe('SPAN')
    expect(badge).toHaveAttribute('title', 'Payment state')
    expect(badge).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps decorative icons hidden while preserving the visible label', () => {
    const iconRef = createRef<SVGSVGElement>()
    render(
      <Badge variant="success" size="sm">
        <CircleCheck ref={iconRef} aria-hidden="true" strokeWidth={2} />
        Active
      </Badge>,
    )
    expect(screen.getByText('Active')).toBeVisible()
    expect(iconRef.current).toHaveAttribute('aria-hidden', 'true')
    expect(iconRef.current).toHaveAttribute('stroke-width', '2')
  })

  it('does not treat the disabled tone as an inactive control', () => {
    render(<Badge variant="disabled">Archived</Badge>)
    expect(screen.getByText('Archived').parentElement).not.toHaveAttribute('disabled')
    expect(screen.getByText('Archived').parentElement).not.toHaveAttribute('aria-disabled')
  })

  it('allows caller utility overrides without conflicting defaults', () => {
    render(
      <Badge size="sm" variant="info" className="h-8 bg-surface text-text-default">
        Custom
      </Badge>,
    )
    const badge = screen.getByText('Custom').parentElement
    expect(badge).toHaveClass('h-8', 'bg-surface', 'text-text-default')
    expect(badge).not.toHaveClass('h-5', 'bg-info', 'text-info-foreground')
  })
})
