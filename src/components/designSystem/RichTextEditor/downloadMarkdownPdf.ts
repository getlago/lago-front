import { Editor } from '@tiptap/core'

import { getBaseExtensions } from './extensions/baseExtensions'
import { configureMention, mentionBaseConfig } from './extensions/Mention.schema'
import { PlanBlockSchema } from './extensions/PlanBlock.schema'
import { printHtmlContent } from './printHtmlContent'
import type { EntityData } from './RichTextEditorContext'

export interface DownloadMarkdownPdfOptions {
  markdown: string
  mentionValues?: Record<string, string>
  plans?: Record<string, EntityData>
}

export const downloadMarkdownPdf = ({
  markdown,
  mentionValues,
  plans,
}: DownloadMarkdownPdfOptions): void => {
  const editor = new Editor({
    extensions: [
      ...getBaseExtensions(),
      configureMention({ ...mentionBaseConfig, mentionValues }),
      PlanBlockSchema.configure({ plans }),
    ],
    content: markdown,
  })

  const html = editor.getHTML()

  editor.destroy()

  printHtmlContent(
    `<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false">${html}</div></div>`,
  )
}
