import { tw } from '~/styles/utils'

describe('legacy tw merger', () => {
  it('does not merge the v2 typography classes', () => {
    expect(tw('v2-text-body', 'v2-text-number')).toBe('v2-text-body v2-text-number')
  })
})
