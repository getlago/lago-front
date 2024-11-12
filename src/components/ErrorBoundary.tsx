import { captureException, withScope } from '@sentry/react'
import { Component, ErrorInfo, ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: { message: string; name: string }, errorInfo: ErrorInfo) {
    withScope((scope) => {
      Object.keys(errorInfo).forEach((key) => {
        // @ts-ignore
        scope.setExtra(key, errorInfo[key])
      })
      captureException(error)
    })

    addToast({
      severity: 'danger',
      translateKey: 'text_622f7a3dc32ce100c46a5154',
    })
  }

  render() {
    return <>{this?.props?.children}</>
  }
}
