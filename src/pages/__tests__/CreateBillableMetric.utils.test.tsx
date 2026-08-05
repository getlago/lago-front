import { hasRemovedFilterValues } from '~/pages/CreateBillableMetric.utils'

describe('CreateBillableMetric.utils', () => {
  describe('hasRemovedFilterValues', () => {
    const original = [
      { key: 'model', values: ['name-1', 'name-2'] },
      { key: 'region', values: ['eu', 'us'] },
    ]

    it('returns false when nothing changed', () => {
      expect(hasRemovedFilterValues(original, original)).toBe(false)
    })

    it('returns true when a value is removed from an existing key', () => {
      const current = [
        { key: 'model', values: ['name-2'] },
        { key: 'region', values: ['eu', 'us'] },
      ]

      expect(hasRemovedFilterValues(original, current)).toBe(true)
    })

    it('returns true when a whole key is removed', () => {
      const current = [{ key: 'region', values: ['eu', 'us'] }]

      expect(hasRemovedFilterValues(original, current)).toBe(true)
    })

    it('returns false when a value is only added', () => {
      const current = [
        { key: 'model', values: ['name-1', 'name-2', 'name-3'] },
        { key: 'region', values: ['eu', 'us'] },
      ]

      expect(hasRemovedFilterValues(original, current)).toBe(false)
    })

    it('returns false when a whole new key is added', () => {
      const current = [...original, { key: 'plan', values: ['pro'] }]

      expect(hasRemovedFilterValues(original, current)).toBe(false)
    })

    it('returns true when a key is renamed (old values are gone)', () => {
      const current = [
        { key: 'model_v2', values: ['name-1', 'name-2'] },
        { key: 'region', values: ['eu', 'us'] },
      ]

      expect(hasRemovedFilterValues(original, current)).toBe(true)
    })

    it('returns false for empty or undefined inputs', () => {
      expect(hasRemovedFilterValues()).toBe(false)
      expect(hasRemovedFilterValues([], [])).toBe(false)
      expect(hasRemovedFilterValues(original, [])).toBe(true)
    })
  })
})
