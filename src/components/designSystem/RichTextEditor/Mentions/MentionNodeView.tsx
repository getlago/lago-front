import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'

export const MENTION_NODE_VIEW_TEST_ID = 'mention-node-view'

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const { mode, mentionValues } = useRichTextEditorContext()
  const id = String(node.attrs.id ?? '')
  const label = String(node.attrs.label ?? id)
  const resolvedValue = mentionValues[id]

  // In preview/PDF (read-only), substitute the resolved value. While authoring
  // (edit mode) keep the @label token so the variable stays visible/editable.
  // A null/missing value falls through to the @label fallback. This mirrors the
  // schema renderHTML, and is the rendering path that actually reaches preview
  // and the PDF (serialized from the live NodeView DOM, not getHTML()).
  if (mode === 'preview' && resolvedValue) {
    return (
      <NodeViewWrapper
        as="span"
        className="variable-mention variable-mention--resolved"
        data-test={MENTION_NODE_VIEW_TEST_ID}
      >
        {resolvedValue}
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span" className="variable-mention" data-test={MENTION_NODE_VIEW_TEST_ID}>
      @{label}
    </NodeViewWrapper>
  )
}
