import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { printHtmlContent } from '~/components/designSystem/RichTextEditor/common/printHtmlContent'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { addToast } from '~/core/apolloClient'

import type { QuotePreviewProps } from './buildQuotePreviewProps'

const PREVIEW_RENDER_TIMEOUT_MS = 5000

interface QuotePdfContextValue {
  download: (props: QuotePreviewProps) => Promise<void>
}

interface PendingRequest {
  props: QuotePreviewProps
  resolve: () => void
  reject: (error: Error) => void
}

const QuotePdfContext = createContext<QuotePdfContextValue | undefined>(undefined)

export const QuotePdfProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<PendingRequest | null>(null)
  const queueRef = useRef<PendingRequest[]>([])

  const advance = useCallback(() => {
    setCurrent(queueRef.current.shift() ?? null)
  }, [])

  // Single-flight: one off-screen render at a time. A request that arrives
  // while another is in flight is queued and runs when the current one settles.
  const download = useCallback(
    (props: QuotePreviewProps): Promise<void> => {
      if (!props.content) return Promise.resolve()

      const promise = new Promise<void>((resolve, reject) => {
        const request: PendingRequest = { props, resolve, reject }

        if (current) {
          queueRef.current.push(request)
        } else {
          setCurrent(request)
        }
      })

      // Suppress unhandled rejection warnings for fire-and-forget callers.
      // Callers that await the promise still receive the rejection.
      promise.catch(() => {})

      return promise
    },
    [current],
  )

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

  return (
    <QuotePdfContext.Provider value={{ download }}>
      {children}
      {current && (
        <div style={{ position: 'fixed', left: -9999, top: 0 }} aria-hidden>
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
