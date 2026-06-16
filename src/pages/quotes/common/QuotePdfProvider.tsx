import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { printHtmlContent } from '~/components/designSystem/RichTextEditor/common/printHtmlContent'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { addToast } from '~/core/apolloClient'

import type { QuotePreviewProps } from './buildQuotePreviewProps'

const PREVIEW_RENDER_TIMEOUT_MS = 5000

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

export const QuotePdfProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<PendingRequest | null>(null)
  const currentRef = useRef<PendingRequest | null>(null)
  const queueRef = useRef<PendingRequest[]>([])
  const requestIdRef = useRef(0)

  const advance = useCallback(() => {
    const next = queueRef.current.shift() ?? null

    currentRef.current = next
    setCurrent(next)
  }, [])

  // Single-flight: one off-screen render at a time. A request that arrives
  // while another is in flight is queued and runs when the current one settles.
  const download = useCallback((props: QuotePreviewProps): Promise<void> => {
    if (!props.content) return Promise.resolve()

    const promise = new Promise<void>((resolve, reject) => {
      requestIdRef.current += 1
      const request: PendingRequest = { id: requestIdRef.current, props, resolve, reject }

      if (currentRef.current) {
        queueRef.current.push(request)
      } else {
        currentRef.current = request
        setCurrent(request)
      }
    })

    // Mark the rejection handled so fire-and-forget callers don't trigger an
    // unhandled-rejection warning; callers that await still receive it.
    promise.catch(() => {})

    return promise
  }, [])

  const handleReady = useCallback(
    (html: string) => {
      if (!current) return

      printHtmlContent(
        `<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false">${html}</div></div>`,
      )
      current.resolve()
      advance()
    },
    [current, advance],
  )

  useEffect(() => {
    if (!current) return

    const timer = setTimeout(() => {
      addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
      current.reject(new Error('Quote preview render timed out'))
      advance()
    }, PREVIEW_RENDER_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [current, advance])

  const contextValue = useMemo(() => ({ download }), [download])

  return (
    <QuotePdfContext.Provider value={contextValue}>
      {children}
      {current && (
        <div key={current.id} className="fixed -left-[9999px] top-0" aria-hidden>
          <RichTextEditor
            mode="preview"
            isCompact
            content={current.props.content}
            entities={current.props.entities}
            mentionValues={current.props.mentionValues}
            customerLocale={current.props.customerLocale}
            customerCurrency={current.props.customerCurrency}
            onPreviewReady={handleReady}
          />
        </div>
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
