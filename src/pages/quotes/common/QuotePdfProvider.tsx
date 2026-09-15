import {
  type ComponentType,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { addToast } from '~/core/apolloClient'
import { preloadContextualLocale } from '~/hooks/core/useContextualLocale'

import type { QuotePreviewProps } from './buildQuotePreviewProps'
import type { QuotePdfRendererProps } from './QuotePdfRenderer'

interface QuotePdfContextValue {
  download: (props: QuotePreviewProps) => Promise<void>
}

interface PendingRequest {
  id: number
  props: QuotePreviewProps
  resolve: () => void
  reject: (error: Error) => void
}

const QuotePdfContext = createContext<QuotePdfContextValue | undefined>(undefined)

export const QuotePdfProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [current, setCurrent] = useState<PendingRequest | null>(null)
  const [Renderer, setRenderer] = useState<ComponentType<QuotePdfRendererProps> | null>(null)
  const currentRef = useRef<PendingRequest | null>(null)
  const queueRef = useRef<PendingRequest[]>([])
  const requestIdRef = useRef(0)

  const advance = useCallback((): void => {
    const next = queueRef.current.shift() ?? null

    currentRef.current = next
    setCurrent(next)
  }, [])

  // Single-flight: one off-screen render at a time. A request that arrives
  // while another is in flight is queued and runs when the current one settles.
  const download = useCallback((previewProps: QuotePreviewProps): Promise<void> => {
    if (!previewProps.content) return Promise.resolve()

    // The editor snapshots its DOM after two animation frames, so the customer
    // locale must be ready before mounting to capture translated pricing headers.
    const result = preloadContextualLocale(previewProps.customerLocale).then(() => {
      return new Promise<void>((resolve, reject) => {
        requestIdRef.current += 1
        const request: PendingRequest = {
          id: requestIdRef.current,
          props: previewProps,
          resolve,
          reject,
        }

        if (currentRef.current) {
          queueRef.current.push(request)
        } else {
          currentRef.current = request
          setCurrent(request)
        }
      })
    })

    // Mark the rejection handled so fire-and-forget callers don't trigger an
    // unhandled-rejection warning; callers that await still receive it.
    result.catch(() => {})

    return result
  }, [])

  const handleComplete = useCallback((): void => {
    if (!current || currentRef.current !== current) return

    current.resolve()
    advance()
  }, [current, advance])

  const handleError = useCallback(
    (error: Error): void => {
      if (!current || currentRef.current !== current) return

      addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
      current.reject(error)
      advance()
    },
    [current, advance],
  )

  useEffect(() => {
    if (!current || Renderer) return

    let active = true

    import('./QuotePdfRenderer')
      .then(({ default: loadedRenderer }) => {
        if (active) setRenderer(() => loadedRenderer)
      })
      .catch((error: Error) => {
        if (active) handleError(error)
      })

    return () => {
      active = false
    }
  }, [current, Renderer, handleError])

  const contextValue = useMemo(() => ({ download }), [download])

  return (
    <QuotePdfContext.Provider value={contextValue}>
      {children}
      {current && Renderer && (
        <Renderer
          key={current.id}
          previewProps={current.props}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}
    </QuotePdfContext.Provider>
  )
}

export const useDownloadQuotePdf = (): QuotePdfContextValue => {
  const context = useContext(QuotePdfContext)

  if (!context) {
    throw new Error('useDownloadQuotePdf must be used within a QuotePdfProvider')
  }

  return context
}
