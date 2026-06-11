import { generateRandomHexId } from '~/core/utils/generateRandomHexId'

describe('generateRandomHexId', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the default byte length', () => {
    describe('WHEN generating an id', () => {
      it('THEN should return a 32-character lowercase hex string (128 bits)', () => {
        expect(generateRandomHexId()).toMatch(/^[0-9a-f]{32}$/)
      })

      it('THEN should return a different value on every call', () => {
        const ids = new Set(Array.from({ length: 1000 }, () => generateRandomHexId()))

        expect(ids.size).toBe(1000)
      })
    })
  })

  describe('GIVEN a custom byte length', () => {
    describe('WHEN generating an id', () => {
      it.each([
        [1, 2],
        [8, 16],
        [32, 64],
      ])('THEN should return %i bytes as %i hex characters', (byteLength, expectedLength) => {
        const id = generateRandomHexId(byteLength)

        expect(id).toHaveLength(expectedLength)
        expect(id).toMatch(/^[0-9a-f]*$/)
      })

      it('THEN should return an empty string for a zero byte length', () => {
        expect(generateRandomHexId(0)).toBe('')
      })
    })
  })

  describe('GIVEN bytes that encode to a single hex digit', () => {
    describe('WHEN generating an id', () => {
      it('THEN should pad each byte to two characters', () => {
        jest.spyOn(crypto, 'getRandomValues').mockImplementation(((array: Uint8Array) => {
          array.set([0, 1, 15, 255])

          return array
        }) as typeof crypto.getRandomValues)

        expect(generateRandomHexId(4)).toBe('00010fff')
      })
    })
  })

  describe('GIVEN an insecure context where crypto.randomUUID is unavailable', () => {
    describe('WHEN generating an id', () => {
      it('THEN should keep working since it only relies on crypto.getRandomValues', () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID')

        Object.defineProperty(crypto, 'randomUUID', {
          value: undefined,
          configurable: true,
          writable: true,
        })

        try {
          expect(generateRandomHexId()).toMatch(/^[0-9a-f]{32}$/)
        } finally {
          if (originalDescriptor) {
            Object.defineProperty(crypto, 'randomUUID', originalDescriptor)
          }
        }
      })
    })
  })
})
