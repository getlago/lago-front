import { getItemFromLS, removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'

const KEY = 'lago-test-key'

describe('localStorage utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
  })

  describe('GIVEN setItemFromLS is called with a nullish value', () => {
    describe('WHEN the value is undefined', () => {
      it('THEN should not persist the string "undefined"', () => {
        setItemFromLS(KEY, undefined)

        expect(localStorage.getItem(KEY)).toBeNull()
      })
    })

    describe('WHEN the value is null', () => {
      it('THEN should not persist the string "null"', () => {
        setItemFromLS(KEY, null)

        expect(localStorage.getItem(KEY)).toBeNull()
      })
    })

    describe('WHEN the key already holds a value', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
      ])('THEN should remove the previous value for %s', (_, value) => {
        setItemFromLS(KEY, 'a-real-token')

        setItemFromLS(KEY, value)

        expect(localStorage.getItem(KEY)).toBeNull()
      })
    })
  })

  describe('GIVEN setItemFromLS is called with a non-nullish value', () => {
    describe('WHEN the value is a string', () => {
      it('THEN should store it verbatim without JSON quoting', () => {
        setItemFromLS(KEY, 'a-real-token')

        expect(localStorage.getItem(KEY)).toBe('a-real-token')
      })
    })

    describe('WHEN the value is not a string', () => {
      it.each([
        ['an object', { locale: 'fr' }],
        ['an array', [1, 2, 3]],
        ['a number', 42],
        ['a boolean', false],
      ])('THEN should JSON stringify %s', (_, value) => {
        setItemFromLS(KEY, value)

        expect(localStorage.getItem(KEY)).toBe(JSON.stringify(value))
      })

      it('THEN should round-trip through getItemFromLS', () => {
        const value = { locale: 'fr', translations: { key: 'label' } }

        setItemFromLS(KEY, value)

        expect(getItemFromLS(KEY)).toEqual(value)
      })
    })
  })

  describe('GIVEN a key was poisoned by an older version', () => {
    describe('WHEN the raw stored value is the string "undefined"', () => {
      it('THEN getItemFromLS should return undefined instead of throwing', () => {
        localStorage.setItem(KEY, 'undefined')

        expect(getItemFromLS(KEY)).toBeUndefined()
      })
    })
  })

  describe('GIVEN a key holds a value getItemFromLS cannot parse', () => {
    describe('WHEN the raw stored value is not valid JSON', () => {
      it('THEN should return the raw string', () => {
        localStorage.setItem(KEY, 'not-json{')

        expect(getItemFromLS(KEY)).toBe('not-json{')
      })
    })
  })

  describe('GIVEN a key was never written', () => {
    describe('WHEN reading it', () => {
      it('THEN should return null', () => {
        expect(getItemFromLS(KEY)).toBeNull()
      })
    })
  })

  describe('GIVEN the underlying storage access throws', () => {
    describe('WHEN reading a key', () => {
      it('THEN getItemFromLS should return undefined instead of throwing', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('The operation is insecure.')
        })

        expect(() => getItemFromLS(KEY)).not.toThrow()
        expect(getItemFromLS(KEY)).toBeUndefined()
      })
    })

    describe('WHEN writing a key', () => {
      it('THEN setItemFromLS should not throw', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError')
        })

        expect(() => setItemFromLS(KEY, 'a-real-token')).not.toThrow()
      })
    })

    describe('WHEN removing a key', () => {
      it('THEN removeItemFromLS should not throw', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('The operation is insecure.')
        })

        expect(() => removeItemFromLS(KEY)).not.toThrow()
      })
    })

    describe('WHEN persisting a nullish value', () => {
      it('THEN setItemFromLS should not throw', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('The operation is insecure.')
        })

        expect(() => setItemFromLS(KEY, undefined)).not.toThrow()
      })
    })
  })
})
