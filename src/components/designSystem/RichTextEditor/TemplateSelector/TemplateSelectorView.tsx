import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import type { EditorTemplate } from './types'

export const TemplateSelectorView = ({ editor, node }: NodeViewProps) => {
  const templates: EditorTemplate[] = node.attrs.templates ?? []

  const handleSelect = (template: EditorTemplate) => {
    editor.chain().focus().setContent(template.content).run()
  }

  return (
    <NodeViewWrapper>
      <div className="template-list">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-item"
            onClick={() => handleSelect(template)}
          >
            <svg className="template-item__icon" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 4.5h10M3 8h10M3 11.5h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="template-item__name">{template.name}</span>
          </button>
        ))}
      </div>
    </NodeViewWrapper>
  )
}
