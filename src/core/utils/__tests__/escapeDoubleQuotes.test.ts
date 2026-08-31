import { escapeDoubleQuotes } from '../escapeDoubleQuotes'

describe('escapeDoubleQuotes', () => {
  describe('GIVEN a value going into a double-quoted HTML attribute', () => {
    describe('WHEN it contains no double quote', () => {
      it('THEN returns it unchanged', () => {
        expect(escapeDoubleQuotes('Enterprise plan')).toBe('Enterprise plan')
      })
    })

    describe('WHEN it contains double quotes', () => {
      it.each([
        ['a single quote', 'The "big" plan', 'The &quot;big&quot; plan'],
        ['a leading quote', '"quoted', '&quot;quoted'],
        ['an attribute break-out attempt', '" onmouseover="x', '&quot; onmouseover=&quot;x'],
      ])('THEN escapes every occurrence for %s', (_, input, expected) => {
        expect(escapeDoubleQuotes(input)).toBe(expected)
      })
    })

    describe('WHEN it is empty', () => {
      it('THEN returns an empty string', () => {
        expect(escapeDoubleQuotes('')).toBe('')
      })
    })
  })
})
