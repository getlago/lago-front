import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, ReactNodeViewRenderer, ReactRenderer, useEditor } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'

import type { Locale } from '~/core/translations'
import type { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import BlockToolbar from './BlockControls/BlockToolbar'
import { downloadMarkdownPdf } from './common/downloadMarkdownPdf'
import {
  type EntityData,
  type OnPricingCommand,
  RichTextEditorProvider,
} from './common/RichTextEditorContext'
import {
  RICH_TEXT_EDITOR_CONTENT_TEST_ID,
  RICH_TEXT_EDITOR_TEST_ID,
  RICH_TEXT_EDITOR_TOOLBAR_TEST_ID,
} from './constants'
import { getBaseExtensions } from './extensions/baseExtensions'
import { DragHandle } from './extensions/DragHandle'
import { LinkPasteHandler } from './extensions/LinkPasteHandler'
import {
  mentionBaseConfig,
  MentionSchema,
  type MentionSchemaOptions,
} from './extensions/Mention.schema'
import { PricingBlock } from './extensions/PricingBlock'
import { type PricingBlockAttributes } from './extensions/PricingBlock.schema'
import { SlashCommands } from './extensions/SlashCommands'
import { TableCommands } from './extensions/TableCommands'
import { TemplateSelectorExtension } from './extensions/TemplateSelectorExtension'
import { MentionList, type MentionListRef } from './Mentions/MentionList'
import { MentionNodeView } from './Mentions/MentionNodeView'
import './richTextEditor.css'
import TableControls from './Table/TableControls'
import type { EditorTemplate } from './TemplateSelector/types'
import Toolbar from './Toolbar/Toolbar'

export type RichTextEditorMode = 'edit' | 'preview'

interface RichTextEditorProps {
  mode?: RichTextEditorMode
  mentionValues?: Record<string, string>
  entities?: Record<string, EntityData>
  content?: string
  templates?: EditorTemplate[]
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>
  downloadPdfRef?: React.MutableRefObject<(() => void) | null>
  onChange?: () => void
  onPricingCommand?: OnPricingCommand
  isPricingDisabled?: () => boolean
  onPricingBlocksChange?: (blocks: PricingBlockAttributes[]) => void
  customerLocale?: Locale
  customerCurrency?: CurrencyEnum
  isCompact?: boolean
}

const variableItems = [
  { id: 'customerName', label: 'Customer Name' },
  { id: 'planName', label: 'Plan Name' },
  { id: 'amountDue', label: 'Amount Due' },
  { id: 'invoiceNumber', label: 'Invoice Number' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'companyName', label: 'Company Name' },
]

const mentionSuggestion: NonNullable<MentionSchemaOptions['suggestion']> = {
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
}

const RichTextEditor = ({
  mode = 'edit',
  mentionValues = {},
  entities: entitiesFromProps = {},
  content,
  templates,
  getMarkdownRef,
  downloadPdfRef,
  onPricingCommand,
  isPricingDisabled,
  onPricingBlocksChange,
  onChange,
  customerLocale,
  customerCurrency,
  isCompact,
}: RichTextEditorProps) => {
  const { translate } = useInternationalization()
  const onChangeRef = useRef(onChange)
  const onPricingBlocksChangeRef = useRef(onPricingBlocksChange)
  const onPricingCommandRef = useRef(onPricingCommand)
  const isPricingDisabledRef = useRef(isPricingDisabled)

  onChangeRef.current = onChange
  onPricingBlocksChangeRef.current = onPricingBlocksChange
  onPricingCommandRef.current = onPricingCommand
  isPricingDisabledRef.current = isPricingDisabled

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
        suggestion: mentionSuggestion,
      } as MentionSchemaOptions),
      PricingBlock.configure({ entities: entitiesFromProps }),
      SlashCommands.configure({
        translate,
        onPricingCommand: onPricingCommand
          ? (params) => onPricingCommandRef.current?.(params)
          : undefined,
        isPricingDisabled: isPricingDisabled
          ? () => isPricingDisabledRef.current?.() ?? false
          : undefined,
      }),
      LinkPasteHandler,
      TemplateSelectorExtension.configure({ templates: templates ?? [] }),
      DragHandle,
      TableCommands,
    ],
    editorProps: {
      attributes: {
        class: isCompact
          ? 'max-w-4xl mx-auto focus:outline-none min-h-[300px] mb-4 px-0'
          : 'max-w-4xl mx-auto focus:outline-none min-h-[300px] my-4 px-10',
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
      onChangeRef.current?.()
      if (!onPricingBlocksChangeRef.current) return

      const blocks: PricingBlockAttributes[] = []

      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === 'pricingBlock' && node.attrs.entityIds?.length) {
          blocks.push({
            pricingType: node.attrs.pricingType,
            entityIds: node.attrs.entityIds,
            localEntityIds: node.attrs.localEntityIds,
          })
        }
      })
      onPricingBlocksChangeRef.current(blocks)
    },
  })

  const isPreview = mode === 'preview'

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreview)
    }
  }, [editor, isPreview])

  const getMarkdown = useCallback((): string | undefined => {
    if (!editor || !editor.storage || !('markdown' in editor.storage)) return undefined

    const storage: unknown = editor.storage.markdown

    if (
      !storage ||
      typeof storage !== 'object' ||
      !('getMarkdown' in storage) ||
      typeof storage.getMarkdown !== 'function'
    )
      return undefined

    const result: unknown = storage.getMarkdown()

    return typeof result === 'string' ? result : undefined
  }, [editor])

  const contextValue = useMemo(
    () => ({
      mode,
      mentionValues,
      entities: entitiesFromProps,
      onPricingCommand,
      customerLocale,
      customerCurrency,
    }),
    [mode, mentionValues, entitiesFromProps, onPricingCommand, customerLocale, customerCurrency],
  )

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
        downloadMarkdownPdf({ markdown, mentionValues, entities: entitiesFromProps })
      }
    }

    return () => {
      if (downloadPdfRef) {
        downloadPdfRef.current = null
      }
    }
  }, [downloadPdfRef, getMarkdown, mentionValues, entitiesFromProps])

  if (!editor) return null

  return (
    <RichTextEditorProvider value={contextValue}>
      <div
        className={`rich-text-editor relative size-full max-h-screen overflow-auto ${isPreview ? '' : 'group/editor'}`}
        data-test={RICH_TEXT_EDITOR_TEST_ID}
      >
        {!isPreview && <Toolbar editor={editor} data-test={RICH_TEXT_EDITOR_TOOLBAR_TEST_ID} />}
        <div className="relative">
          <EditorContent editor={editor} data-test={RICH_TEXT_EDITOR_CONTENT_TEST_ID} />
          {!isPreview && <TableControls editor={editor} />}
        </div>
        {!isPreview && <BlockToolbar editor={editor} />}
      </div>
    </RichTextEditorProvider>
  )
}

export default RichTextEditor
