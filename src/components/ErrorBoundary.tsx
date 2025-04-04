import { ApolloError } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'

interface ErrorBoundaryProps {
  children: ReactNode
}

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('component', 'App')
      }}
      showDialog={false}
      onError={(error, componentStack, eventId) => {
        // Add detailed error info to Sentry context
        Sentry.withScope((scope) => {
          scope.setExtra('componentStack', componentStack)
          scope.setExtra('sentryEventId', eventId)

          Sentry.captureException(error)
        })

        // Only show toast notification if not an Apollo/GraphQL error
        // Apollo errors are already handled in apollo init.ts
        if (!(error instanceof ApolloError)) {
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
