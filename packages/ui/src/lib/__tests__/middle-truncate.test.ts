import { middleTruncate } from '../middle-truncate'

it('preserves the last five graphemes and fits the available width', () => {
  expect(middleTruncate('a-long-customer-12345', (text) => text.length <= 10)).toBe('a-lo…12345')
  expect(middleTruncate('short', () => true)).toBe('short')
  expect(
    middleTruncate('abcdef👨‍👩‍👧‍👦1234', (text) => [...new Intl.Segmenter().segment(text)].length <= 8),
  ).toBe('ab…👨‍👩‍👧‍👦1234')
})
