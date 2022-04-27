import { ReactNode, Component } from 'react'

import { addToast } from '~/core/apolloClient'

// import { catchError } from '~/core/datadogRUM'

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends Component<{}, ErrorBoundaryProps> {
  componentDidCatch(/*error: { message: string; name: string }, errorInfo: unknown */) {
    // TODO
    // catchError(error)

    // catchError(new Error('Application crashed'), {
    //   info: errorInfo,
    //   error: { message: error.message, name: error.name },
    // })

    addToast({
      severity: 'danger',
      translateKey: 'text_622f7a3dc32ce100c46a5154',
    })
  }

  render() {
    return <>{this.props.children}</>
  }
}
