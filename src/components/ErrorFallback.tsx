import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

export const ERROR_FALLBACK_TEST_ID = 'error-fallback'

/**
 * Full-screen placeholder rendered by `ErrorBoundary` when a subtree crashes,
 * including a route whose chunk could not be downloaded. It always offers a way
 * out (refresh) so a stale build can never leave the user on a blank screen.
 */
export const ErrorFallback = () => {
  const { translate } = useInternationalization()

  return (
    <div
      className="flex size-full min-h-screen items-center justify-center"
      data-test={ERROR_FALLBACK_TEST_ID}
    >
      <GenericPlaceholder
        title={translate('text_6250304370f0f700a8fdc270')}
        subtitle={translate('text_6250304370f0f700a8fdc274')}
        buttonTitle={translate('text_6250304370f0f700a8fdc278')}
        buttonVariant="primary"
        buttonAction={() => window.location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    </div>
  )
}
