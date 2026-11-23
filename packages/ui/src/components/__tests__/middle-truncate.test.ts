import { middleTruncate } from '../../lib/middle-truncate'

const width = (value: string): number =>
  Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length

it('preserves short values and the final five characters on overflow', () => {
  expect(middleTruncate('short', 5, width)).toBe('short')
  expect(middleTruncate('customer_123456789', 10, width)).toBe('cust…56789')
  expect(middleTruncate('customer_123456789', 6, width)).toBe('…56789')
})
it('preserves grapheme clusters and protects the suffix in extremely narrow layouts', () => {
  expect(middleTruncate('abcdefgh👨‍👩‍👧‍👦éxyz', 7, width)).toBe('a…👨‍👩‍👧‍👦éxyz')
  expect(middleTruncate('customer_123456789', 3, width)).toBe('56789')
})
it('uses measured proportional widths instead of character count', () => {
  const measure = (value: string): number =>
    Array.from(value).reduce((sum, char) => sum + (char === 'W' ? 4 : 1), 0)

  expect(middleTruncate('WWWW_12345', 10, measure)).toBe('W…12345')
})
