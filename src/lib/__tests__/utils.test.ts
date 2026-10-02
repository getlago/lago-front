import { tw } from '~/styles/utils'

import { cn } from '../utils'

describe('shadcn typography merging', () => {
  it('replaces the component typography with the caller typography', () => {
    expect(cn('v2-text-body rounded-md', 'v2-text-number')).toBe('rounded-md v2-text-number')
    expect(cn('v2-text-label', 'v2-text-code')).toBe('v2-text-code')
  })

  it('preserves emphasis, colors and conditional classes', () => {
    expect(cn('v2-text-body text-red', { 'v2-emphasis': true })).toBe(
      'v2-text-body text-red v2-emphasis',
    )
  })

  it('retains ordinary Tailwind conflict resolution without changing the legacy merger', () => {
    expect(cn('px-3 text-sm', 'px-6 text-lg')).toBe('px-6 text-lg')
    expect(tw('v2-text-body', 'v2-text-number')).toBe('v2-text-body v2-text-number')
  })
})
