import { render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { NumericBadge } from '../numeric-badge'

describe('NumericBadge', () => {
  it.each([0, 1, 12, 999, '99+'])('displays %s without hiding or formatting it', (value) => {
    render(<NumericBadge value={value} />)
    expect(screen.getByText(String(value))).toBeVisible()
  })

  it('forwards its ref and accessible label without adding interactive semantics', () => {
    const ref = createRef<HTMLSpanElement>()

    render(<NumericBadge ref={ref} value={12} aria-label="12 invoices" />)
    expect(ref.current).toBe(screen.getByLabelText('12 invoices'))
    expect(ref.current?.tagName).toBe('SPAN')
    expect(ref.current).not.toHaveAttribute('tabindex')
    expect(ref.current).not.toHaveAttribute('role')
  })

  it('lets disabled styling take precedence over selection without adding a disabled DOM attribute', () => {
    const ref = createRef<HTMLSpanElement>()

    render(<NumericBadge ref={ref} value={3} selected disabled />)
    expect(ref.current).toHaveClass('text-disabled-foreground')
    expect(ref.current).not.toHaveClass('text-text-default')
    expect(ref.current).not.toHaveAttribute('disabled')
    expect(ref.current).not.toHaveAttribute('selected')
  })
})
