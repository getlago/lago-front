import { Editor } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { LinkCard } from './extensions/LinkCard'
import { PlanBlockSchema } from './extensions/PlanBlock.schema'
import { printHtmlContent } from './printHtmlContent'
import type { EntityData } from './RichTextEditorContext'

export interface DownloadMarkdownPdfOptions {
  markdown: string
  mentionValues?: Record<string, string>
  plans?: Record<string, EntityData>
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const resolveMentions = (html: string, mentionValues: Record<string, string>): string =>
  html.replace(
    /<span[^>]*data-type="mention"[^>]*data-id="([^"]*)"[^>]*class="variable-mention"[^>]*>@[^<]*<\/span>/g,
    (_match, id: string) => {
      const resolvedValue = mentionValues[id]

      if (resolvedValue) {
        return `<span data-type="mention" data-id="${id}" class="variable-mention variable-mention--resolved">${escapeHtml(resolvedValue)}</span>`
      }

      return _match
    },
  )

const resolvePlanBlocks = (html: string, plans: Record<string, EntityData>): string =>
  html.replace(
    /<div[^>]*data-type="plan-block"[^>]*data-plan-id="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
    (_match, planId: string) => {
      const plan = plans[planId]

      if (plan) {
        return `<div data-type="plan-block" data-plan-id="${planId}" class="plan-block"><table class="plan-block__table"><thead><tr><th>Plan name</th><th>Plan code</th></tr></thead><tbody><tr><td>${escapeHtml(plan.name)}</td><td>${escapeHtml(plan.code)}</td></tr></tbody></table></div>`
      }

      return _match
    },
  )

const getHeadlessExtensions = () => [
  StarterKit,
  Link.configure({ openOnClick: false }),
  Underline,
  Superscript,
  Subscript,
  Highlight,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  Mention.extend({
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
                  `<span data-type="mention" data-id="${id}" data-label="${label}" class="variable-mention">@${label}</span>`,
              )
            },
          },
        },
      }
    },
  }).configure({
    HTMLAttributes: { class: 'variable-mention' },
    renderHTML({ node }) {
      return [
        'span',
        { 'data-type': 'mention', 'data-id': node.attrs.id, class: 'variable-mention' },
        `@${node.attrs.label ?? node.attrs.id}`,
      ]
    },
  }),
  LinkCard,
  PlanBlockSchema,
  Markdown.configure({ html: true }),
]

export const downloadMarkdownPdf = ({
  markdown,
  mentionValues,
  plans,
}: DownloadMarkdownPdfOptions): void => {
  const editor = new Editor({
    extensions: getHeadlessExtensions(),
    content: markdown,
  })

  let html = editor.getHTML()

  editor.destroy()

  if (mentionValues) {
    html = resolveMentions(html, mentionValues)
  }

  if (plans) {
    html = resolvePlanBlocks(html, plans)
  }

  printHtmlContent(
    `<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false">${html}</div></div>`,
  )
}
