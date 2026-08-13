import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import {
  type BillingItemsPayload,
  buildPreviewEntities,
} from '~/core/serializers/serializeQuoteBillingItems'
import type { Locale } from '~/core/translations'
import type {
  CurrencyEnum,
  QuotePreviewCustomerFragment,
  QuotePreviewVersionFragment,
} from '~/generated/graphql'

export interface QuotePdfHeaderData {
  rows: Array<string>
  documentNumber: string
}

export interface QuotePreviewProps {
  content: string
  entities: Record<string, EntityData>
  customerLocale: Locale
  /** The quote's own currency, which can differ from the customer's. */
  documentCurrency?: CurrencyEnum
  mentionValues: Record<string, string>
  images: Record<string, string>
  header?: QuotePdfHeaderData
}

export const buildQuotePreviewProps = ({
  version,
  customer,
  images = {},
  header,
}: {
  version: QuotePreviewVersionFragment | null | undefined
  customer: QuotePreviewCustomerFragment | null | undefined
  images?: Record<string, string>
  header?: QuotePdfHeaderData
}): QuotePreviewProps => {
  // The version currency is the document's own currency and wins over the
  // customer's — the two can differ now that a quote's currency is editable.
  // The customer's remains the fallback for versions created before that.
  // The schema types the version currency as a plain String, hence the cast —
  // same as every other quote-version currency read.
  const currency =
    (version?.currency as CurrencyEnum | undefined) ?? customer?.currency ?? undefined

  return {
    content: version?.content ?? '',
    entities: version?.billingItems
      ? buildPreviewEntities(version.billingItems as BillingItemsPayload, currency)
      : {},
    customerLocale: (customer?.billingConfiguration?.documentLocale ?? 'en') as Locale,
    documentCurrency: currency,
    mentionValues: (version?.mentionVariables ?? {}) as Record<string, string>,
    images,
    header,
  }
}
