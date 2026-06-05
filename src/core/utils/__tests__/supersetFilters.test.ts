import { SUPERSET_FILTERS_LS_KEY_PREFIX } from '~/core/constants/localStorageKeys'
import { extractNativeFilters, getSupersetFiltersLsKey } from '~/core/utils/supersetFilters'

describe('extractNativeFilters', () => {
  describe('GIVEN an empty dataMask', () => {
    describe('WHEN called with no entries', () => {
      it('THEN should return an empty object', () => {
        expect(extractNativeFilters({})).toEqual({})
      })
    })
  })

  describe('GIVEN entries without NATIVE_FILTER- prefix', () => {
    describe('WHEN called with non-native filter keys', () => {
      it('THEN should skip all entries', () => {
        const dataMask = {
          'OTHER_KEY-abc': { filterState: { value: 'EUR' } },
          'SOME_FILTER-xyz': { filterState: { value: ['USD'] } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({})
      })
    })
  })

  describe('GIVEN entries with missing filterState', () => {
    describe('WHEN filterState is undefined', () => {
      it('THEN should skip the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': {},
        }

        expect(extractNativeFilters(dataMask)).toEqual({})
      })
    })
  })

  describe('GIVEN entries with null or undefined values', () => {
    describe('WHEN filterState.value is null', () => {
      it('THEN should skip the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: null } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({})
      })
    })

    describe('WHEN filterState.value is undefined', () => {
      it('THEN should skip the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: undefined } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({})
      })
    })
  })

  describe('GIVEN entries with empty array values', () => {
    describe('WHEN filterState.value is an empty array', () => {
      it('THEN should skip the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: [] } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({})
      })
    })
  })

  describe('GIVEN entries with valid filter values', () => {
    describe('WHEN filterState.value is a non-empty array', () => {
      it('THEN should include the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: ['EUR'] } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({
          'NATIVE_FILTER-abc': { filterState: { value: ['EUR'] } },
        })
      })
    })

    describe('WHEN filterState.value is a string', () => {
      it('THEN should include the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: 'Last quarter' } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({
          'NATIVE_FILTER-abc': { filterState: { value: 'Last quarter' } },
        })
      })
    })

    describe('WHEN filterState.value is a number', () => {
      it('THEN should include the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: 42 } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({
          'NATIVE_FILTER-abc': { filterState: { value: 42 } },
        })
      })
    })

    describe('WHEN filterState.value is a boolean', () => {
      it('THEN should include the entry', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': { filterState: { value: true } },
        }

        expect(extractNativeFilters(dataMask)).toEqual({
          'NATIVE_FILTER-abc': { filterState: { value: true } },
        })
      })
    })
  })

  describe('GIVEN a mix of valid and invalid entries', () => {
    describe('WHEN dataMask contains multiple entries', () => {
      it('THEN should only include valid native filter entries', () => {
        const dataMask = {
          'NATIVE_FILTER-valid1': { filterState: { value: ['EUR'], label: 'Currency' } },
          'NATIVE_FILTER-nullVal': { filterState: { value: null } },
          'NATIVE_FILTER-emptyArr': { filterState: { value: [] } },
          'NATIVE_FILTER-valid2': { filterState: { value: 'Last quarter' } },
          'OTHER_KEY-skip': { filterState: { value: 'something' } },
          'NATIVE_FILTER-noState': {},
        }

        const result = extractNativeFilters(dataMask)

        expect(Object.keys(result)).toHaveLength(2)
        expect(result).toEqual({
          'NATIVE_FILTER-valid1': { filterState: { value: ['EUR'], label: 'Currency' } },
          'NATIVE_FILTER-valid2': { filterState: { value: 'Last quarter' } },
        })
      })
    })
  })

  describe('GIVEN entries with extra filterState properties', () => {
    describe('WHEN filterState has additional fields beyond value', () => {
      it('THEN should preserve the full filterState object', () => {
        const dataMask = {
          'NATIVE_FILTER-abc': {
            filterState: {
              value: ['EUR'],
              excludeFilterValues: true,
              label: 'Currency',
            },
          },
        }

        expect(extractNativeFilters(dataMask)).toEqual({
          'NATIVE_FILTER-abc': {
            filterState: {
              value: ['EUR'],
              excludeFilterValues: true,
              label: 'Currency',
            },
          },
        })
      })
    })
  })
})

describe('getSupersetFiltersLsKey', () => {
  describe('GIVEN an org id and a dashboard title', () => {
    describe('WHEN the title contains spaces and uppercase letters', () => {
      it('THEN should slugify the title (lowercase, spaces joined with "-")', () => {
        expect(getSupersetFiltersLsKey('org-1', 'Lago Dashboard')).toBe(
          `${SUPERSET_FILTERS_LS_KEY_PREFIX}org-1-lago-dashboard`,
        )
        expect(getSupersetFiltersLsKey('org-1', 'Revenue Recognition')).toBe(
          `${SUPERSET_FILTERS_LS_KEY_PREFIX}org-1-revenue-recognition`,
        )
      })
    })
  })

  describe('GIVEN the same org but different dashboard titles', () => {
    describe('WHEN building keys for both dashboards', () => {
      it('THEN should produce distinct keys so filters do not leak between dashboards', () => {
        const analyticsKey = getSupersetFiltersLsKey('org-1', 'Lago Dashboard')
        const revenueKey = getSupersetFiltersLsKey('org-1', 'Revenue Recognition')

        expect(analyticsKey).not.toBe(revenueKey)
      })
    })
  })

  describe('GIVEN the same dashboard title but different orgs', () => {
    describe('WHEN building keys for both orgs', () => {
      it('THEN should produce distinct keys so filters stay scoped per org', () => {
        const orgAKey = getSupersetFiltersLsKey('org-a', 'Lago Dashboard')
        const orgBKey = getSupersetFiltersLsKey('org-b', 'Lago Dashboard')

        expect(orgAKey).not.toBe(orgBKey)
      })
    })
  })
})
