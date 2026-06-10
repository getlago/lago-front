import { Editor } from '@tiptap/core'

import { printHtmlContent } from './printHtmlContent'
import type { EntityData } from './RichTextEditorContext'

import { getBaseExtensions } from '../extensions/baseExtensions'
import { configureMention, mentionBaseConfig } from '../extensions/Mention.schema'
import { PricingBlockSchema } from '../extensions/PricingBlock.schema'

export interface DownloadMarkdownPdfOptions {
  markdown: string
  mentionValues?: Record<string, string>
  entities?: Record<string, EntityData>
}

export const downloadMarkdownPdf = ({
  markdown,
  mentionValues,
  entities,
}: DownloadMarkdownPdfOptions): void => {
  const editor = new Editor({
    extensions: [
      ...getBaseExtensions(),
      configureMention({ ...mentionBaseConfig, mentionValues }),
      PricingBlockSchema.configure({ entities }),
    ],
    content: markdown,
  })

  const html = editor.getHTML()

  editor.destroy()

  printHtmlContent(
    `<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false">${html}</div></div>`,
  )
}
