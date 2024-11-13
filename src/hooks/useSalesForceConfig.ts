import { useSearchParams } from 'react-router-dom'

type TEventData = {
  action: string
  rel: string
  [key: string]: string
}

type TUseSalesForceConfigReturn = {
  isRunningInSalesForceIframe: boolean
  emitSalesForceEvent: (data: TEventData) => void
}

export const useSalesForceConfig = (): TUseSalesForceConfigReturn => {
  const [searchParams] = useSearchParams()

  const isRunningInSalesForceIframe = !!searchParams.get('sfdc')

  const emitSalesForceEvent = (data: TEventData) => {
    window.parent.postMessage(JSON.stringify(data), '*')
  }

  return { isRunningInSalesForceIframe, emitSalesForceEvent }
}
