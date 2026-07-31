import { ApolloError } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { ReactElement, ReactNode } from 'react'

import { ErrorFallback } from '~/components/ErrorFallback'
import { addToast } from '~/core/apolloClient/reactiveVars/toastVar'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Value of the `errorBoundary` Sentry tag, to tell scopes apart. */
  name?: string
  /** Rendered in place of the crashed subtree. Defaults to the full-screen placeholder. */
  fallback?: ReactElement
  /** Disable the danger toast where the fallback already communicates the failure. */
  showToast?: boolean
}

export const ErrorBoundary = ({
  children,
  name = 'App',
  fallback,
  showToast = true,
}: ErrorBoundaryProps) => {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('component', 'ErrorBoundary')
      }}
      showDialog={false}
      fallback={fallback ?? <ErrorFallback />}
      // Sentry derives `handled` from `!!fallback`. Setting it explicitly keeps
      // caught errors reported as unhandled, as they were before we added a
      // fallback, so crash-rate numbers stay comparable.
      handled={false}
      onError={(error, componentStack, eventId) => {
        // Add detailed error info to Sentry context
        Sentry.withScope((scope) => {
          scope.setLevel('error')
          scope.setTag('errorBoundary', name)
          scope.setTag('errorCategory', 'global')

          // Type guard for Error objects
          // Sentry automatically extracts error.message and error.stack for Error objects
          // We only add custom tag for filtering/grouping and handle non-Error objects
          if (error instanceof Error) {
            scope.setTag('errorType', error.name || 'UnknownError')
          } else {
            scope.setTag('errorType', 'UnknownError')
            scope.setExtra('error', String(error))
          }

          scope.setExtra('componentStack', componentStack)
          scope.setExtra('sentryEventId', eventId)

          // Add URL context
          if (typeof window !== 'undefined') {
            scope.setExtra('url', window.location.href)
            scope.setExtra('pathname', window.location.pathname)
            scope.setExtra('referrer', document.referrer)
          }

          Sentry.captureException(error)
        })

        // Only show toast notification if not an Apollo/GraphQL error
        // Apollo errors are already handled in apollo init.ts
        if (showToast && !(error instanceof ApolloError)) {
          addToast({
            severity: 'danger',
            translateKey: 'text_622f7a3dc32ce100c46a5154',
          })
        }
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
