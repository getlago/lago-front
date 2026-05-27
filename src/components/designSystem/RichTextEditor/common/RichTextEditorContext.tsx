import { createContext, useContext } from 'react'

import type { PricingBlockAttributes, PricingType } from '../extensions/PricingBlock.schema'
import type { RichTextEditorMode } from '../RichTextEditor'

export type EntityData = {
  entityId: string
  entityType: 'plan' | 'addOn'
  name: string
  code: string
  units?: string
  unitAmountCents?: string
}

export interface PricingCommandParams {
  onSave: (attrs: PricingBlockAttributes, entityData: Record<string, EntityData>) => void
  editData?: { pricingType: PricingType; entityIds: string[] }
}

export type OnPricingCommand = (params: PricingCommandParams) => void

interface RichTextEditorContextValue {
  mode: RichTextEditorMode
  mentionValues: Record<string, string>
  entities: Record<string, EntityData>
  onPricingCommand?: OnPricingCommand
}

const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  mode: 'edit',
  mentionValues: {},
  entities: {},
})

export const RichTextEditorProvider = RichTextEditorContext.Provider

export const useRichTextEditorContext = () => useContext(RichTextEditorContext)
