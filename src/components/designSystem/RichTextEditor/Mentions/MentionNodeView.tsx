import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

export const MENTION_NODE_VIEW_TEST_ID = 'mention-node-view'

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const id = String(node.attrs.id ?? '')
  const label = String(node.attrs.label ?? id)

  return (
    <NodeViewWrapper as="span" className="variable-mention" data-test={MENTION_NODE_VIEW_TEST_ID}>
      @{label}
    </NodeViewWrapper>
  )
}
