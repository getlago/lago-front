import {
  FeatureFlags,
  getEnableFeatureFlags,
  isFeatureFlagActive,
  listFeatureFlags,
  setFeatureFlags,
} from '~/core/utils/featureFlags'

const FF_KEY = 'featureFlags'

describe('featureFlags', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('listFeatureFlags', () => {
    it('returns every declared flag', () => {
      expect(listFeatureFlags()).toEqual([
        FeatureFlags.SUPERSET_PERSISTENT_FILTERS,
        FeatureFlags.REVENUE_RECOGNITION,
      ])
    })
  })

  describe('getEnableFeatureFlags', () => {
    it('returns an empty array when nothing is stored', () => {
      expect(getEnableFeatureFlags()).toEqual([])
    })

    it('returns the stored flags', () => {
      localStorage.setItem(FF_KEY, JSON.stringify([FeatureFlags.REVENUE_RECOGNITION]))

      expect(getEnableFeatureFlags()).toEqual([FeatureFlags.REVENUE_RECOGNITION])
    })

    it('drops values that are not declared flags', () => {
      localStorage.setItem(
        FF_KEY,
        JSON.stringify(['revenue_recognition_typo', FeatureFlags.REVENUE_RECOGNITION, 42, null]),
      )

      expect(getEnableFeatureFlags()).toEqual([FeatureFlags.REVENUE_RECOGNITION])
    })

    // The stored value is hand-editable in devtools, so every malformed shape has
    // to resolve to an empty array instead of throwing — see Sentry FRONT-17H.
    describe.each([
      ['the literal string undefined', 'undefined'],
      ['a JSON null', 'null'],
      ['a JSON number', '42'],
      ['a JSON object', '{}'],
      ['a JSON string holding a flag name', '"revenue_recognition"'],
      ['an unquoted flag name', 'revenue_recognition'],
      ['an unquoted array of flag names', '[revenue_recognition]'],
      ['a coerced object', '[object Object]'],
      ['a comma-joined array', 'superset_persistent_filters,revenue_recognition'],
    ])('when the stored value is %s', (_label, stored) => {
      beforeEach(() => {
        localStorage.setItem(FF_KEY, stored)
      })

      it('returns an empty array', () => {
        expect(getEnableFeatureFlags()).toEqual([])
      })

      it('clears the corrupted value so the next read is clean', () => {
        getEnableFeatureFlags()

        expect(localStorage.getItem(FF_KEY)).toBeNull()
      })

      it('does not report any flag as active', () => {
        expect(isFeatureFlagActive(FeatureFlags.REVENUE_RECOGNITION)).toBe(false)
      })
    })

    it('keeps an empty stored value untouched', () => {
      localStorage.setItem(FF_KEY, '')

      expect(getEnableFeatureFlags()).toEqual([])
      expect(localStorage.getItem(FF_KEY)).toBe('')
    })
  })

  describe('isFeatureFlagActive', () => {
    it('is true for a stored flag', () => {
      setFeatureFlags(FeatureFlags.REVENUE_RECOGNITION)

      expect(isFeatureFlagActive(FeatureFlags.REVENUE_RECOGNITION)).toBe(true)
    })

    it('is false for a flag that is not stored', () => {
      setFeatureFlags(FeatureFlags.REVENUE_RECOGNITION)

      expect(isFeatureFlagActive(FeatureFlags.SUPERSET_PERSISTENT_FILTERS)).toBe(false)
    })
  })

  describe('setFeatureFlags', () => {
    it('stores a single flag', () => {
      expect(setFeatureFlags(FeatureFlags.REVENUE_RECOGNITION)).toEqual([
        FeatureFlags.REVENUE_RECOGNITION,
      ])
      expect(localStorage.getItem(FF_KEY)).toBe(JSON.stringify([FeatureFlags.REVENUE_RECOGNITION]))
    })

    it('stores a list of flags', () => {
      expect(
        setFeatureFlags([
          FeatureFlags.REVENUE_RECOGNITION,
          FeatureFlags.SUPERSET_PERSISTENT_FILTERS,
        ]),
      ).toEqual([FeatureFlags.REVENUE_RECOGNITION, FeatureFlags.SUPERSET_PERSISTENT_FILTERS])
    })

    it('stores every flag when asked for all', () => {
      expect(setFeatureFlags('all')).toEqual(listFeatureFlags())
    })

    it('clears the flags when given an empty list', () => {
      setFeatureFlags('all')

      expect(setFeatureFlags([])).toEqual([])
    })

    it('drops names that are not declared flags', () => {
      expect(setFeatureFlags(['revenue_recognition_typo' as FeatureFlags])).toEqual([])
      expect(getEnableFeatureFlags()).toEqual([])
    })
  })
})
