import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, ReactNodeViewRenderer, ReactRenderer, useEditor } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { downloadMarkdownPdf } from './downloadMarkdownPdf'
import { getBaseExtensions } from './extensions/baseExtensions'
import { LinkPasteHandler } from './extensions/LinkPasteHandler'
import {
  mentionBaseConfig,
  MentionSchema,
  type MentionSchemaOptions,
} from './extensions/Mention.schema'
import { PlanBlock } from './extensions/PlanBlock'
import { SlashCommands } from './extensions/SlashCommands'
import { TemplateSelectorExtension } from './extensions/TemplateSelectorExtension'
import { MentionList, type MentionListRef } from './MentionList'
import { MentionNodeView } from './MentionNodeView'
import './richTextEditor.css'
import { EntityData, RichTextEditorProvider } from './RichTextEditorContext'
import TableControls from './TableControls'
import type { EditorTemplate } from './TemplateSelector/types'
import Toolbar from './Toolbar'

export const RICH_TEXT_EDITOR_TEST_ID = 'rich-text-editor'
export const RICH_TEXT_EDITOR_TOOLBAR_TEST_ID = 'rich-text-editor-toolbar'
export const RICH_TEXT_EDITOR_CONTENT_TEST_ID = 'rich-text-editor-content'
export const RICH_TEXT_EDITOR_SAVE_BUTTON_TEST_ID = 'rich-text-editor-save-button'

export type RichTextEditorMode = 'edit' | 'preview'

interface RichTextEditorProps {
  mode?: RichTextEditorMode
  mentionValues?: Record<string, string>
  plans?: Record<string, EntityData>
  content?: string
  templates?: EditorTemplate[]
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>
  downloadPdfRef?: React.MutableRefObject<(() => void) | null>
  onPlanBlocksChange?: (planIds: string[]) => void
}

const RichTextEditor = ({
  mode = 'edit',
  mentionValues = {},
  plans: plansFromProps = {},
  content,
  templates,
  getMarkdownRef,
  downloadPdfRef,
  onPlanBlocksChange,
}: RichTextEditorProps) => {
  const { translate } = useInternationalization()
  const onPlanBlocksChangeRef = useRef(onPlanBlocksChange)
  const [plans, setPlans] = useState<Record<string, EntityData>>(plansFromProps)

  onPlanBlocksChangeRef.current = onPlanBlocksChange

  const setPlan = useCallback((id: string, data: EntityData) => {
    setPlans((prev) => ({ ...prev, [id]: data }))
  }, [])

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
      ...getBaseExtensions({ tableResizable: true }),

      // Editor-specific overrides and additions
      Placeholder.configure({
        placeholder: translate('text_1774281162711nymiwumt66k'),
      }),
      MentionSchema.extend({
        addNodeView() {
          return ReactNodeViewRenderer(MentionNodeView, { as: 'span' })
        },
      }).configure({
        ...mentionBaseConfig,
        mentionValues,
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
      } as MentionSchemaOptions),
      PlanBlock.configure({ plans: plansFromProps }),
      SlashCommands.configure({ translate }),
      LinkPasteHandler,
      TemplateSelectorExtension.configure({ templates: templates ?? [] }),
    ],
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    content:
      content ??
      (templates && templates.length > 0
        ? {
            type: 'doc',
            content: [
              { type: 'paragraph' },
              {
                type: 'templateSelector',
                attrs: { templates },
              },
            ],
          }
        : ''),
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
    () => ({ mode, mentionValues, plans, setPlan }),
    [mode, mentionValues, plans, setPlan],
  )

  const getMarkdown = useCallback((): string | undefined => {
    if (!editor) return undefined

    const markdownExt = editor.extensionManager.extensions.find((ext) => ext.name === 'markdown')
    const storage = markdownExt?.storage

    if (!storage || typeof storage.getMarkdown !== 'function') return undefined

    return storage.getMarkdown() as string
  }, [editor])

  useEffect(() => {
    if (!getMarkdownRef) return

    getMarkdownRef.current = () => getMarkdown() ?? ''

    return () => {
      if (getMarkdownRef) {
        getMarkdownRef.current = null
      }
    }
  }, [getMarkdownRef, getMarkdown])

  useEffect(() => {
    if (!downloadPdfRef) return

    downloadPdfRef.current = () => {
      const markdown = getMarkdown()

      if (markdown) {
        downloadMarkdownPdf({ markdown, mentionValues, plans })
      }
    }

    return () => {
      if (downloadPdfRef) {
        downloadPdfRef.current = null
      }
    }
  }, [downloadPdfRef, getMarkdown, mentionValues, plans])

  if (!editor) return null

  if (isPreview) {
    return (
      <div
        className="rich-text-editor relative h-full max-h-screen overflow-auto"
        data-test={RICH_TEXT_EDITOR_TEST_ID}
      >
        <div
          className="ProseMirror"
          contentEditable={false}
          data-test={RICH_TEXT_EDITOR_CONTENT_TEST_ID}
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      </div>
    )
  }

  return (
    <RichTextEditorProvider value={contextValue}>
      <div
        className="rich-text-editor relative h-full max-h-screen overflow-auto"
        data-test={RICH_TEXT_EDITOR_TEST_ID}
      >
        <Toolbar editor={editor} data-test={RICH_TEXT_EDITOR_TOOLBAR_TEST_ID} />
        <div className="relative pb-8 pr-8">
          <EditorContent editor={editor} data-test={RICH_TEXT_EDITOR_CONTENT_TEST_ID} />
          <TableControls editor={editor} />
        </div>
      </div>
    </RichTextEditorProvider>
  )
}

export default RichTextEditor
