import { obfuscateValue } from '~/core/formats/obfuscate'

describe('obfuscate', () => {
  it('should obfuscate a given string', () => {
    expect(obfuscateValue('I')).toBe('••••••••I')
    expect(obfuscateValue('hello')).toBe('••••••••llo')
    expect(obfuscateValue('11199999-9999-4522-9acd-8659999d9ae8')).toBe('••••••••ae8')
    expect(obfuscateValue('11199999-9999-4522-9acd-8659999d9ae8', { prefixLength: 3 })).toBe(
      '•••ae8',
    )
  })
})
