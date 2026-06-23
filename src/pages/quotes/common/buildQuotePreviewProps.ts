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
  customerCurrency?: CurrencyEnum
  mentionValues: Record<string, string>
  header?: QuotePdfHeaderData
}

export const buildQuotePreviewProps = (
  version: QuotePreviewVersionFragment | null | undefined,
  customer: QuotePreviewCustomerFragment | null | undefined,
  header?: QuotePdfHeaderData,
): QuotePreviewProps => ({
  content: version?.content ?? '',
  entities: version?.billingItems
    ? buildPreviewEntities(version.billingItems as BillingItemsPayload)
    : {},
  customerLocale: (customer?.billingConfiguration?.documentLocale ?? 'en') as Locale,
  customerCurrency: customer?.currency ?? undefined,
  // Placeholder until the backend exposes mention values; intentionally empty for now.
  mentionValues: {},
  header,
})
