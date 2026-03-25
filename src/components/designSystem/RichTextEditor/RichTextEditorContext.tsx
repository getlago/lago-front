import { createContext, useContext } from 'react'

import type { RichTextEditorMode } from './RichTextEditor'

interface RichTextEditorContextValue {
  mode: RichTextEditorMode
  mentionValues: Record<string, string>
}

const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  mode: 'edit',
  mentionValues: {},
})

export const RichTextEditorProvider = RichTextEditorContext.Provider

export const useRichTextEditorContext = () => useContext(RichTextEditorContext)
