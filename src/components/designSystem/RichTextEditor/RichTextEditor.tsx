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
import { EditorContent, ReactNodeViewRenderer, ReactRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { tw } from 'lago-design-system'
import { useEffect, useMemo, useRef } from 'react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { Markdown } from 'tiptap-markdown'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LinkCard } from './extensions/LinkCard'
import { LinkPasteHandler } from './extensions/LinkPasteHandler'
import { PlanBlock } from './extensions/PlanBlock'
import { SlashCommands } from './extensions/SlashCommands'
import { MentionList, type MentionListRef } from './MentionList'
import { MentionNodeView } from './MentionNodeView'
import './richTextEditor.css'
import { EntityData, RichTextEditorProvider } from './RichTextEditorContext'
import TableControls from './TableControls'
import Toolbar from './Toolbar'

export const RICH_TEXT_EDITOR_TEST_ID = 'rich-text-editor'
export const RICH_TEXT_EDITOR_TOOLBAR_TEST_ID = 'rich-text-editor-toolbar'
export const RICH_TEXT_EDITOR_CONTENT_TEST_ID = 'rich-text-editor-content'
export const RICH_TEXT_EDITOR_SAVE_BUTTON_TEST_ID = 'rich-text-editor-save-button'

export type RichTextEditorMode = 'edit' | 'preview'

interface RichTextEditorProps {
  mode?: RichTextEditorMode
  mentionValues?: Record<string, string>
  entityDataMap?: Record<string, EntityData>
  content?: string
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>
  onPlanBlocksChange?: (planIds: string[]) => void
}

const RichTextEditor = ({
  mode = 'edit',
  mentionValues = {},
  entityDataMap = {},
  content,
  getMarkdownRef,
  onPlanBlocksChange,
}: RichTextEditorProps) => {
  const { translate } = useInternationalization()
  const onPlanBlocksChangeRef = useRef(onPlanBlocksChange)

  onPlanBlocksChangeRef.current = onPlanBlocksChange

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
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
      }),
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
        placeholder: translate('text_1774281162711nymiwumt66k'),
      }),
      Mention.extend({
        addNodeView() {
          return ReactNodeViewRenderer(MentionNodeView, { as: 'span' })
        },
        addStorage() {
          return {
            markdown: {
              serialize(
                state: { write: (text: string) => void },
                node: { attrs: { id: string; label?: string } },
              ) {
                state.write(`{${node.attrs.id}|${node.attrs.label ?? node.attrs.id}}`)
              },
              parse: {
                updateDOM(element: HTMLElement) {
                  element.innerHTML = element.innerHTML.replaceAll(
                    /\{(\w+)\|([^}]+)\}/g,
                    (_match: string, id: string, label: string) =>
                      `<span data-type="mention" data-id="${id}" class="variable-mention">@${label}</span>`,
                  )
                },
              },
            },
          }
        },
      }).configure({
        HTMLAttributes: { class: 'variable-mention' },
        suggestion: {
          char: '@',
          items: ({ query }) =>
            variableItems.filter((v) => v.label.toLowerCase().includes(query.toLowerCase())),
          render: () => {
            let renderer: ReactRenderer<MentionListRef>
            let popup: TippyInstance[]

            return {
              onStart: (suggestionProps) => {
                renderer = new ReactRenderer(MentionList, {
                  props: suggestionProps,
                  editor: suggestionProps.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: () => suggestionProps.clientRect?.() ?? new DOMRect(),
                  appendTo: () => document.body,
                  content: renderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate: (suggestionProps) => {
                renderer.updateProps(suggestionProps)

                popup[0].setProps({
                  getReferenceClientRect: () => suggestionProps.clientRect?.() ?? new DOMRect(),
                })
              },
              onKeyDown: (keyDownProps) => {
                if (keyDownProps.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }

                return renderer.ref?.onKeyDown(keyDownProps) ?? false
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
      SlashCommands.configure({ translate }),
      LinkCard,
      LinkPasteHandler,
      PlanBlock,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    content: content ?? '',
    onUpdate: ({ editor: editorInstance }) => {
      if (!onPlanBlocksChangeRef.current) return

      const planIds: string[] = []

      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === 'planBlock' && node.attrs.planId) {
          planIds.push(String(node.attrs.planId))
        }
      })
      onPlanBlocksChangeRef.current(planIds)
    },
  })

  const isPreview = mode === 'preview'

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreview)
    }
  }, [editor, isPreview])

  const contextValue = useMemo(
    () => ({ mode, mentionValues, entityDataMap }),
    [mode, mentionValues, entityDataMap],
  )

  useEffect(() => {
    if (!editor || !getMarkdownRef) return

    getMarkdownRef.current = () => {
      const markdownExt = editor.extensionManager.extensions.find((ext) => ext.name === 'markdown')
      const storage = markdownExt?.storage

      if (!storage || typeof storage.getMarkdown !== 'function') return

      return storage.getMarkdown()
    }

    return () => {
      if (getMarkdownRef) {
        getMarkdownRef.current = null
      }
    }
  }, [editor, getMarkdownRef])

  if (!editor) return null

  return (
    <RichTextEditorProvider value={contextValue}>
      <div
        className="rich-text-editor relative h-full max-h-screen overflow-auto"
        data-test={RICH_TEXT_EDITOR_TEST_ID}
      >
        {!isPreview && <Toolbar editor={editor} data-test={RICH_TEXT_EDITOR_TOOLBAR_TEST_ID} />}
        <div
          className={tw('relative', {
            'pb-8 pr-8': !isPreview,
          })}
        >
          <EditorContent editor={editor} data-test={RICH_TEXT_EDITOR_CONTENT_TEST_ID} />
          {!isPreview && <TableControls editor={editor} />}
        </div>
      </div>
    </RichTextEditorProvider>
  )
}

export default RichTextEditor
