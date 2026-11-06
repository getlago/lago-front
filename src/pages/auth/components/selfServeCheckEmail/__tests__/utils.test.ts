import { formatCountdown } from '../utils'

describe('formatCountdown', () => {
  describe('GIVEN a number of seconds', () => {
    describe('WHEN formatting it', () => {
      it.each([
        [0, '0:00'],
        [5, '0:05'],
        [59, '0:59'],
        [60, '1:00'],
        [125, '2:05'],
      ])('THEN should show %i seconds as %s', (seconds, expected) => {
        expect(formatCountdown(seconds)).toBe(expected)
      })
    })
  })
})
