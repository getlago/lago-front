import { createContext, useContext } from 'react'

import type { PlanPreviewData } from '~/core/serializers/buildPlanPreviewData'
import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import type { Locale } from '~/core/translations'
import type { CurrencyEnum } from '~/generated/graphql'

import type { PricingBlockAttributes, PricingType } from '../extensions/PricingBlock.schema'
import type { RichTextEditorMode } from '../RichTextEditor'

export type EntityData = {
  entityId: string
  entityType: 'plan' | 'addOn'
  name: string
  invoiceDisplayName?: string
  code: string
  description?: string
  units?: string
  unitAmountCents?: string
  totalAmount?: string
  fromDatetime?: string
  toDatetime?: string
  plan?: PlanPreviewData
}

export interface PricingCommandParams {
  onSave: (
    attrs: PricingBlockAttributes,
    entityData: Record<string, EntityData>,
    billingItems?: BillingItemsPayload,
  ) => void
  editData?: { pricingType: PricingType; entityIds: string[]; localEntityIds?: string[] }
}

export type OnPricingCommand = (params: PricingCommandParams) => void

interface RichTextEditorContextValue {
  mode: RichTextEditorMode
  mentionValues: Record<string, string>
  entities: Record<string, EntityData>
  onPricingCommand?: OnPricingCommand
  customerLocale?: Locale
  customerCurrency?: CurrencyEnum
}

const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  mode: 'edit',
  mentionValues: {},
  entities: {},
})

export const RichTextEditorProvider = RichTextEditorContext.Provider

export const useRichTextEditorContext = () => useContext(RichTextEditorContext)
