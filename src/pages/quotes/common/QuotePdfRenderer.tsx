import { type ReactElement, useCallback, useEffect, useRef } from 'react'

import { printHtmlContent } from '~/components/designSystem/RichTextEditor/common/printHtmlContent'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'

import type { QuotePreviewProps } from './buildQuotePreviewProps'
import { QuotePdfHeader } from './QuotePdfHeader'

const PREVIEW_RENDER_TIMEOUT_MS = 5000

export interface QuotePdfRendererProps {
  previewProps: QuotePreviewProps
  onComplete: () => void
  onError: (error: Error) => void
}

const QuotePdfRenderer = ({
  previewProps,
  onComplete,
  onError,
}: QuotePdfRendererProps): ReactElement => {
  const headerRef = useRef<HTMLDivElement>(null)
  const { header } = previewProps

  const handleReady = useCallback(
    (html: string): void => {
      // Capture the live header so the print iframe receives its MUI/emotion styles.
      const headerHtml = header && headerRef.current ? headerRef.current.innerHTML : ''
      const fullHtml = `<div class="rich-text-editor">${headerHtml}<div class="ProseMirror" contenteditable="false">${html}</div></div>`

      if (header) {
        printHtmlContent(fullHtml, { title: header.documentNumber })
      } else {
        printHtmlContent(fullHtml)
      }
      onComplete()
    },
    [header, onComplete],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      onError(new Error('Quote preview render timed out'))
    }, PREVIEW_RENDER_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [onError])

  return (
    <div className="fixed left-[-9999px] top-0" aria-hidden>
      {header && (
        <div ref={headerRef}>
          <QuotePdfHeader header={header} />
        </div>
      )}
      <RichTextEditor
        mode="preview"
        isCompact
        content={previewProps.content}
        entities={previewProps.entities}
        mentionValues={previewProps.mentionValues}
        images={previewProps.images}
        customerLocale={previewProps.customerLocale}
        documentCurrency={previewProps.documentCurrency}
        onPreviewReady={handleReady}
      />
    </div>
  )
}

export default QuotePdfRenderer
