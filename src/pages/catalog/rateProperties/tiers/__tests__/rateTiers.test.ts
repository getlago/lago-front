import { parseDecimal, toPercentRatio } from '../rateTiers'

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

describe('toPercentRatio', () => {
  describe('GIVEN a rate typed in percent', () => {
    it.each([
      ['8.2', 0.082],
      ['12.3', 0.123],
    ])('WHEN it is %p THEN it is the ratio %p without float noise', (rate, expected) => {
      expect(toPercentRatio(rate)).toBe(expected)
    })

    it.each(['', null])('WHEN it is %p THEN it is 0', (rate) => {
      expect(toPercentRatio(rate)).toBe(0)
    })
  })
})
