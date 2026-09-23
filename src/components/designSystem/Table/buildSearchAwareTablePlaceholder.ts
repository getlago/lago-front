import { TablePlaceholder } from '~/components/designSystem/Table/Table'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const SEARCH_ERROR_TITLE_KEY = 'text_623b53fea66c76017eaebb6e'
const SEARCH_ERROR_SUBTITLE_KEY = 'text_63bab307a61c62af497e0599'
const ERROR_TITLE_KEY = 'text_629728388c4d2300e2d380d5'
const ERROR_SUBTITLE_KEY = 'text_629728388c4d2300e2d380eb'
const ERROR_RELOAD_KEY = 'text_629728388c4d2300e2d38110'
const SEARCH_EMPTY_SUBTITLE_KEY = 'text_63bee4e10e2d53912bfe4da7'

type SearchAwareTablePlaceholderOptions = {
  translate: TranslateFunc
  /** Swaps both states to their "no result for this search" wording */
  hasSearchTerm: boolean
  /** Empty-state title while a search is active */
  noResultTitleKey: string
  emptyTitleKey: string
  emptySubtitleKey: string
  /** Omit to render the empty state without a call to action */
  emptyAction?: { buttonTitleKey: string; onClick: () => void }
}

/**
 * Builds the search-aware `placeholder` every list table shares: a generic error state
 * offering a reload, and an empty state whose wording and call to action depend on
 * whether a search is narrowing the collection.
 */
export const buildSearchAwareTablePlaceholder = ({
  translate,
  hasSearchTerm,
  noResultTitleKey,
  emptyTitleKey,
  emptySubtitleKey,
  emptyAction,
}: SearchAwareTablePlaceholderOptions): TablePlaceholder => {
  if (hasSearchTerm) {
    return {
      errorState: {
        title: translate(SEARCH_ERROR_TITLE_KEY),
        subtitle: translate(SEARCH_ERROR_SUBTITLE_KEY),
      },
      emptyState: {
        title: translate(noResultTitleKey),
        subtitle: translate(SEARCH_EMPTY_SUBTITLE_KEY),
      },
    }
  }

  return {
    errorState: {
      title: translate(ERROR_TITLE_KEY),
      subtitle: translate(ERROR_SUBTITLE_KEY),
      buttonTitle: translate(ERROR_RELOAD_KEY),
      buttonVariant: 'primary',
      buttonAction: () => location.reload(),
    },
    emptyState: {
      title: translate(emptyTitleKey),
      subtitle: translate(emptySubtitleKey),
      ...(emptyAction && {
        buttonTitle: translate(emptyAction.buttonTitleKey),
        buttonVariant: 'primary' as const,
        buttonAction: emptyAction.onClick,
      }),
    },
  }
}
