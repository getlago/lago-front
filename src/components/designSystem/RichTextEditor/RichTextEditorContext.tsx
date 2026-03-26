import { createContext, useContext } from 'react'

import type { RichTextEditorMode } from './RichTextEditor'

export type EntityData = {
  entityId: string
  entityType: 'plan'
  name: string
  code: string
  overrides?: unknown
}

interface RichTextEditorContextValue {
  mode: RichTextEditorMode
  mentionValues: Record<string, string>
  plans: Record<string, EntityData>
  setPlan: (id: string, data: EntityData) => void
}

const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  mode: 'edit',
  mentionValues: {},
  plans: {},
  setPlan: () => {},
})

export const RichTextEditorProvider = RichTextEditorContext.Provider

export const useRichTextEditorContext = () => useContext(RichTextEditorContext)
