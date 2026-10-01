import { parseDecimal } from '../rateTiers'

describe('parseDecimal', () => {
  describe('GIVEN a value typed in an up-to input', () => {
    it.each([
      ['10.5', '10.5'],
      ['10.', '10'],
      ['.5', '0.5'],
      [7, '7'],
    ])('WHEN it is %p THEN it parses as %p', (value, expected) => {
      expect(parseDecimal(value)?.toFixed()).toBe(expected)
    })

    it.each(['', '.', 'abc', null, undefined])('WHEN it is %p THEN it is not a number', (value) => {
      expect(parseDecimal(value)).toBeUndefined()
    })
  })
})
