import type { Extensions } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import type { Node as PmNode } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { BlockColors, createColorAwareSerialize } from './BlockColors'
import { LinkCard } from './LinkCard'

// Extend Paragraph and Heading with color-aware markdown serialization.
// When a block has backgroundColor or textColor, it is emitted as HTML so the
// colors survive the markdown round-trip. Non-colored blocks use the standard
// markdown output.
const ColorAwareParagraph = Paragraph.extend({
  addStorage() {
    return {
      markdown: {
        serialize: createColorAwareSerialize(function (state, node) {
          state.renderInline(node)
          state.closeBlock(node)
        }),
        parse: {},
      },
    }
  },
})

const ColorAwareHeading = Heading.extend({
  addStorage() {
    return {
      markdown: {
        serialize: createColorAwareSerialize(function (state, node) {
          state.write(`${state.repeat('#', (node as PmNode).attrs.level as number)} `)
          state.renderInline(node)
          state.closeBlock(node)
        }),
        parse: {},
      },
    }
  },
})

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
  StarterKit.configure({
    link: false,
    underline: false,
    dropcursor: { color: '#3b82f6' },
    paragraph: false,
    heading: false,
  }),
  ColorAwareParagraph,
  ColorAwareHeading,
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
  BlockColors,
  Markdown.configure({ html: true }),
]
