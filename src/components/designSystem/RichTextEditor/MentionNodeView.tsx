import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { useRichTextEditorContext } from './RichTextEditorContext'

export const MENTION_NODE_VIEW_TEST_ID = 'mention-node-view'
export const MENTION_NODE_VIEW_RESOLVED_TEST_ID = 'mention-node-view-resolved'

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const { mode, mentionValues } = useRichTextEditorContext()

  const id = node.attrs.id as string
  const label = (node.attrs.label as string) ?? id

  if (mode === 'preview') {
    const resolvedValue = mentionValues[id]

    if (resolvedValue) {
      return (
        <NodeViewWrapper
          as="span"
          className="variable-mention variable-mention--resolved"
          data-test={MENTION_NODE_VIEW_RESOLVED_TEST_ID}
        >
          {`{${resolvedValue}}`}
        </NodeViewWrapper>
      )
    }
  }

  return (
    <NodeViewWrapper as="span" className="variable-mention" data-test={MENTION_NODE_VIEW_TEST_ID}>
      @{label}
    </NodeViewWrapper>
  )
}
