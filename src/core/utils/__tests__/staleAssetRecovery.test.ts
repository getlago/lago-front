import { hasReloadedRecently, markReloaded } from '../staleAssetRecovery'

describe('staleAssetRecovery', () => {
  const FAKE_NOW = 1700000000000

  beforeEach(() => {
    jest.useFakeTimers({ now: FAKE_NOW })
    sessionStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('GIVEN no reload has been marked', () => {
    describe('WHEN hasReloadedRecently is called', () => {
      it('THEN should return false', () => {
        expect(hasReloadedRecently()).toBe(false)
      })
    })
  })

  describe('GIVEN a reload was marked within the cooldown window', () => {
    describe('WHEN hasReloadedRecently is called', () => {
      it('THEN should return true', () => {
        markReloaded()

        expect(hasReloadedRecently()).toBe(true)
      })
    })
  })

  describe('GIVEN a reload was marked outside the cooldown window', () => {
    describe('WHEN hasReloadedRecently is called', () => {
      it('THEN should return false', () => {
        sessionStorage.setItem('lago_chunk_reload', String(FAKE_NOW - 15_000))

        expect(hasReloadedRecently()).toBe(false)
      })
    })
  })

  describe('GIVEN sessionStorage.getItem throws', () => {
    describe('WHEN hasReloadedRecently is called', () => {
      it('THEN should return true to avoid an infinite reload loop', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new DOMException('Storage blocked')
        })

        expect(hasReloadedRecently()).toBe(true)
      })
    })
  })

  describe('GIVEN sessionStorage.setItem throws', () => {
    describe('WHEN markReloaded is called', () => {
      it('THEN should not throw', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new DOMException('Storage full')
        })

        expect(() => markReloaded()).not.toThrow()
      })
    })
  })
})
