import { createContext, useContext } from 'react'

import type { RichTextEditorMode } from './RichTextEditor'

export type EntityData = Record<string, string | number | boolean | null>

interface RichTextEditorContextValue {
  mode: RichTextEditorMode
  mentionValues: Record<string, string>
  entityDataMap?: Record<string, EntityData>
}

const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  mode: 'edit',
  mentionValues: {},
})

export const RichTextEditorProvider = RichTextEditorContext.Provider

export const useRichTextEditorContext = () => useContext(RichTextEditorContext)
