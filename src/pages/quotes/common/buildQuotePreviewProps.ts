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

export interface QuotePreviewProps {
  content: string
  entities: Record<string, EntityData>
  customerLocale: Locale
  customerCurrency?: CurrencyEnum
  mentionValues: Record<string, string>
}

export const buildQuotePreviewProps = (
  version: QuotePreviewVersionFragment | null | undefined,
  customer: QuotePreviewCustomerFragment | null | undefined,
): QuotePreviewProps => ({
  content: version?.content ?? '',
  entities: version?.billingItems
    ? buildPreviewEntities(version.billingItems as BillingItemsPayload)
    : {},
  customerLocale: (customer?.billingConfiguration?.documentLocale ?? 'en') as Locale,
  customerCurrency: customer?.currency ?? undefined,
  // Placeholder until the backend exposes mention values; intentionally empty for now.
  mentionValues: {},
})
