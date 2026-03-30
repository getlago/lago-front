import type { Extensions } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
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

import { LinkCard } from './LinkCard'

interface BaseExtensionsOptions {
  tableResizable?: boolean
}

/**
 * Extensions shared between the interactive editor and headless consumers.
 *
 * Does NOT include Mention or PlanBlock — those require different configurations
 * (node views, suggestion) depending on the consumer. Each consumer adds them separately
 * using MentionSchema/PlanBlockSchema from their respective .schema.ts files.
 */
export const getBaseExtensions = (options?: BaseExtensionsOptions): Extensions => [
  StarterKit.configure({ link: false, underline: false }),
  Link.configure({ openOnClick: false }),
  Underline,
  Superscript,
  Subscript,
  Highlight,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image,
  Table.configure({ resizable: options?.tableResizable ?? false }),
  TableRow,
  TableCell,
  TableHeader,
  LinkCard,
  Markdown.configure({ html: true }),
]
