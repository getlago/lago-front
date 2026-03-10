import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'

import { MentionList, type MentionItem, type MentionListRef } from './MentionList'
import { LinkCard } from './extensions/LinkCard'
import { LinkPasteHandler } from './extensions/LinkPasteHandler'
import { SlashCommands } from './extensions/SlashCommands'
import './richTextEditor.css'
import Toolbar from './Toolbar'

const RichTextEditor = () => {
  const variableItems = [
    { id: 'customerName', label: 'Customer Name' },
    { id: 'planName', label: 'Plan Name' },
    { id: 'amountDue', label: 'Amount Due' },
    { id: 'invoiceNumber', label: 'Invoice Number' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'companyName', label: 'Company Name' },
  ]

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      Superscript,
      Subscript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: 'Type / for commands...',
      }),
      Mention.configure({
        HTMLAttributes: { class: 'variable-mention' },
        suggestion: {
          char: '@',
          items: ({ query }) =>
            variableItems.filter((v) => v.label.toLowerCase().includes(query.toLowerCase())),
          render: () => {
            let renderer: ReactRenderer<MentionListRef>
            let popup: TippyInstance[]

            return {
              onStart: (props: SuggestionProps<MentionItem>) => {
                renderer = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: renderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate: (props: SuggestionProps<MentionItem>) => {
                renderer.updateProps(props)

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }

                return renderer.ref?.onKeyDown(props) ?? false
              },
              onExit: () => {
                popup[0].destroy()
                renderer.destroy()
              },
            }
          },
        },
        renderHTML({ node }) {
          return [
            'span',
            { 'data-type': 'mention', 'data-id': node.attrs.id, class: 'variable-mention' },
            `@${node.attrs.label ?? node.attrs.id}`,
          ]
        },
      }),
      LinkCard,
      LinkPasteHandler,
      SlashCommands,
    ],
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    content: '<p>Start typing here...</p>',
  })

  if (!editor) return null

  return (
    <div className="rich-text-editor relative h-full max-h-screen overflow-auto">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
