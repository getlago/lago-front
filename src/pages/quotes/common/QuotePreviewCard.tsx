import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import type { QuotePreviewProps } from './buildQuotePreviewProps'

interface QuotePreviewCardProps {
  /** Document number shown in the card header, e.g. `QUOTE-001-001 - v3`. */
  quoteNumber: string
  /** Whether the quote version has content to render. */
  hasContent: boolean
  previewProps: QuotePreviewProps
  loading?: boolean
  dataTest?: string
}

/**
 * Read-only quote document preview, rendered as a bordered card on the grey
 * `Side` panel of the void pages. The header line mirrors the quote PDF
 * document number; the body is the read-only `RichTextEditor` preview.
 */
export const QuotePreviewCard = ({
  quoteNumber,
  hasContent,
  previewProps,
  loading,
  dataTest,
}: QuotePreviewCardProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="h-full overflow-auto p-8" data-test={dataTest}>
      <div className="mx-auto flex w-full max-w-180 flex-col gap-8 rounded-xl border border-grey-300 bg-white p-8">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-5/6" />
          </div>
        ) : (
          <>
            <Typography variant="caption" color="grey600">
              {translate('text_17818008544903clzyy4ziu1', { quoteNumber })}
            </Typography>
            {hasContent ? (
              <RichTextEditor mode="preview" isCompact {...previewProps} />
            ) : (
              <Typography color="grey500">{translate('text_17768523811635qaasto1ziv')}</Typography>
            )}
          </>
        )}
      </div>
    </div>
  )
}
