import { render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { Separator } from '../separator'

describe('Separator', () => {
  it('is decorative and not focusable by default', () => {
    render(<Separator data-testid="divider" />)
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    expect(screen.getByTestId('divider')).not.toHaveAttribute('tabindex')
  })

  it('supports semantic vertical separators and forwards refs and attributes', () => {
    const ref = createRef<HTMLDivElement>()

    render(<Separator ref={ref} decorative={false} orientation="vertical" aria-label="Sections" />)
    const separator = screen.getByRole('separator', { name: 'Sections' })

    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(ref.current).toBe(separator)
  })
})
