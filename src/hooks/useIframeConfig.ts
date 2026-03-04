import { useSearchParams } from 'react-router-dom'

type TEventData = {
  action: string
  rel: string
  [key: string]: string
}

type TUseIframeConfigReturn = {
  emitIframeMessage: (data: TEventData) => void
  emitSalesForceEvent: (data: TEventData) => void
  isRunningInIframeContext: boolean
  isRunningInSalesForceIframe: boolean
}

export const useIframeConfig = (): TUseIframeConfigReturn => {
  const [searchParams] = useSearchParams()

  const isRunningInSalesForceIframe = !!searchParams.get('sfdc')
  const isRunningInIframeContext = !!searchParams.get('ifrm')

  const emitSalesForceEvent = (data: TEventData) => {
    window.parent.postMessage(JSON.stringify(data), '*')
  }

  const emitIframeMessage = (data: TEventData) => {
    window.postMessage(JSON.stringify(data), '*')
  }

  return {
    isRunningInSalesForceIframe,
    isRunningInIframeContext,
    emitSalesForceEvent,
    emitIframeMessage,
  }
}
