import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'

const translate = (key: string): string => key

describe('buildSearchAwareTablePlaceholder', () => {
  describe('GIVEN no active search', () => {
    it('THEN should offer a reload on the error state', () => {
      const { errorState } = buildSearchAwareTablePlaceholder({
        translate,
        hasSearchTerm: false,
        noResultTitleKey: 'no-result',
        emptyTitleKey: 'empty-title',
        emptySubtitleKey: 'empty-subtitle',
      })

      expect(errorState).toEqual(
        expect.objectContaining({
          title: 'text_629728388c4d2300e2d380d5',
          subtitle: 'text_629728388c4d2300e2d380eb',
          buttonTitle: 'text_629728388c4d2300e2d38110',
          buttonVariant: 'primary',
        }),
      )
    })

    it('THEN should use the empty wording without a call to action', () => {
      const { emptyState } = buildSearchAwareTablePlaceholder({
        translate,
        hasSearchTerm: false,
        noResultTitleKey: 'no-result',
        emptyTitleKey: 'empty-title',
        emptySubtitleKey: 'empty-subtitle',
      })

      expect(emptyState).toEqual({ title: 'empty-title', subtitle: 'empty-subtitle' })
    })

    describe('WHEN an empty action is provided', () => {
      it('THEN should wire it to the empty state button', () => {
        const onClick = jest.fn()

        const { emptyState } = buildSearchAwareTablePlaceholder({
          translate,
          hasSearchTerm: false,
          noResultTitleKey: 'no-result',
          emptyTitleKey: 'empty-title',
          emptySubtitleKey: 'empty-subtitle',
          emptyAction: { buttonTitleKey: 'create', onClick },
        })

        expect(emptyState).toEqual({
          title: 'empty-title',
          subtitle: 'empty-subtitle',
          buttonTitle: 'create',
          buttonVariant: 'primary',
          buttonAction: onClick,
        })
      })
    })
  })

  describe('GIVEN an active search', () => {
    it('THEN should drop the reload button from the error state', () => {
      const { errorState } = buildSearchAwareTablePlaceholder({
        translate,
        hasSearchTerm: true,
        noResultTitleKey: 'no-result',
        emptyTitleKey: 'empty-title',
        emptySubtitleKey: 'empty-subtitle',
      })

      expect(errorState).toEqual({
        title: 'text_623b53fea66c76017eaebb6e',
        subtitle: 'text_63bab307a61c62af497e0599',
      })
    })

    it('THEN should use the no-result wording and ignore the empty action', () => {
      const { emptyState } = buildSearchAwareTablePlaceholder({
        translate,
        hasSearchTerm: true,
        noResultTitleKey: 'no-result',
        emptyTitleKey: 'empty-title',
        emptySubtitleKey: 'empty-subtitle',
        emptyAction: { buttonTitleKey: 'create', onClick: jest.fn() },
      })

      expect(emptyState).toEqual({
        title: 'no-result',
        subtitle: 'text_63bee4e10e2d53912bfe4da7',
      })
    })
  })
})
