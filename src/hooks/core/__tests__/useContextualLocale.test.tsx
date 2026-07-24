import { renderHook } from '@testing-library/react'

import { preloadContextualLocale, useContextualLocale } from '~/hooks/core/useContextualLocale'

// `mock`-prefixed so jest allows referencing it inside the hoisted factory.
const mockGetTranslations = jest.fn(() => Promise.resolve({ text_header_name: 'Nom' }))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  // AppEnvEnum.production — inlined because jest.mock factories can't reference imports.
  envGlobalVar: () => ({ appEnv: 'production' }),
}))

jest.mock('~/core/translations', () => ({
  ...jest.requireActual('~/core/translations'),
  getTranslations: () => mockGetTranslations(),
}))

describe('useContextualLocale()', () => {
  beforeEach(() => {
    mockGetTranslations.mockClear()
  })

  describe('preloadContextualLocale()', () => {
    it('warms the cache so the hook resolves translations on its first render', async () => {
      // Preload before render — this is what QuotePdfProvider does before mounting the
      // off-screen editor so the very first (synchronous) render already has the bundle.
      await preloadContextualLocale('fr')

      const { result } = renderHook(() => useContextualLocale('fr'))

      // First render (state initializer) already returns the translated value instead of
      // the empty-string "not ready" sentinel — the fix for LAGO-1686.
      expect(result.current.translateWithContextualLocal('text_header_name')).toBe('Nom')
      expect(mockGetTranslations).toHaveBeenCalled()
    })

    it('does not re-fetch a locale that is already cached', async () => {
      // Distinct locale so this assertion is independent of the module-level cache
      // populated by the previous test.
      await preloadContextualLocale('de')
      const callsAfterFirst = mockGetTranslations.mock.calls.length

      await preloadContextualLocale('de')

      expect(mockGetTranslations.mock.calls.length).toBe(callsAfterFirst)
    })
  })
})
