import { comparable, sortedWithoutTypename } from '../comparableValue'

describe('sortedWithoutTypename', () => {
  describe('GIVEN an object graph', () => {
    describe('WHEN it carries __typename keys', () => {
      it('THEN should drop them at every depth', () => {
        const result = sortedWithoutTypename({
          __typename: 'Plan',
          charges: [{ __typename: 'Charge', properties: { __typename: 'Props', amount: '1' } }],
        })

        expect(result).toEqual({ charges: [{ properties: { amount: '1' } }] })
      })
    })

    describe('WHEN keys are declared in different orders', () => {
      it('THEN should produce the same sorted shape', () => {
        expect(sortedWithoutTypename({ b: 1, a: 2 })).toEqual(sortedWithoutTypename({ a: 2, b: 1 }))
        expect(Object.keys(sortedWithoutTypename({ b: 1, a: 2 }) as object)).toEqual(['a', 'b'])
      })
    })

    describe('WHEN it holds primitives and null', () => {
      it.each([
        ['a string', 'value'],
        ['a number', 42],
        ['a boolean', true],
        ['null', null],
        ['undefined', undefined],
      ])('THEN should return %s unchanged', (_, value) => {
        expect(sortedWithoutTypename(value)).toBe(value)
      })
    })

    describe('WHEN arrays hold objects', () => {
      it('THEN should preserve array order', () => {
        const result = sortedWithoutTypename([{ b: 1, a: 2 }, { c: 3 }])

        expect(result).toEqual([{ a: 2, b: 1 }, { c: 3 }])
      })
    })
  })
})

describe('comparable', () => {
  describe('GIVEN two values built by different code paths', () => {
    describe('WHEN they differ only by key order', () => {
      it('THEN should compare equal', () => {
        expect(comparable({ a: 1, b: 2 })).toBe(comparable({ b: 2, a: 1 }))
      })
    })

    describe('WHEN one side carries __typename', () => {
      it('THEN should compare equal', () => {
        expect(comparable({ code: 'api', __typename: 'Metric' })).toBe(comparable({ code: 'api' }))
      })
    })

    describe('WHEN one side has an explicitly-undefined key the other dropped', () => {
      it('THEN should compare equal', () => {
        // This is the JSON round-trip a stored quote payload goes through.
        expect(comparable({ amount: '1', rate: undefined })).toBe(comparable({ amount: '1' }))
      })
    })

    describe('WHEN a value really differs', () => {
      it('THEN should compare unequal', () => {
        expect(comparable({ amount: '1' })).not.toBe(comparable({ amount: '2' }))
      })
    })

    describe('WHEN a key is missing on one side with a null value on the other', () => {
      it('THEN should compare unequal', () => {
        // null survives JSON, so it stays a real difference — unlike undefined.
        expect(comparable({ amount: null })).not.toBe(comparable({}))
      })
    })
  })
})
