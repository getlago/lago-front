import type { Extensions } from '@tiptap/core'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import CodeBlock from '@tiptap/extension-code-block'
import Color from '@tiptap/extension-color'
import Heading from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import type { DOMOutputSpec, Node as PmNode } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { BlockColors, createColorAwareSerialize } from './BlockColors'
import { wrapInBlockWrapper } from './BlockWrapper'
import { LinkCard } from './LinkCard'

// -- Color-aware markdown serialization ---------------------------------------
// When a block has backgroundColor or textColor, it is emitted as HTML so the
// colors survive the markdown round-trip.

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

// -- Block wrappers -----------------------------------------------------------
// Every top-level block is wrapped in <div class="spacer"><div class="block-wrapper">
// to provide consistent spacing, selection targets, and future extensibility.
const WrappedParagraph = ColorAwareParagraph.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['p', 0] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('paragraph', inner)
  },
})

const WrappedHeading = ColorAwareHeading.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['h1', 0] satisfies DOMOutputSpec)
    const level = (props.node.attrs.level as number) || 1

    return wrapInBlockWrapper(`heading-${level}`, inner)
  },
})

const WrappedBulletList = BulletList.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['ul', 0] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('bulletList', inner)
  },
})

const WrappedOrderedList = OrderedList.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['ol', 0] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('orderedList', inner)
  },
})

const WrappedBlockquote = Blockquote.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['blockquote', 0] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('blockquote', inner)
  },
})

const WrappedCodeBlock = CodeBlock.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['pre', ['code', 0]] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('codeBlock', inner)
  },
})

const WrappedImage = Image.extend({
  renderHTML(props) {
    const inner = this.parent ? this.parent(props) : (['img'] satisfies DOMOutputSpec)

    return wrapInBlockWrapper('image', inner)
  },
})

// -- Extension list -----------------------------------------------------------

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
    dropcursor: { color: '#dbeafe', width: 4 }, // blue-100
    paragraph: false,
    heading: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    codeBlock: false,
  }),
  WrappedParagraph,
  WrappedHeading,
  WrappedBulletList,
  WrappedOrderedList,
  WrappedBlockquote,
  WrappedCodeBlock,
  WrappedImage.configure(Image.options),
  Link.configure({ openOnClick: false }),
  Underline,
  Superscript,
  Subscript,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: options?.tableResizable ?? false }),
  TableRow,
  TableCell,
  TableHeader,
  LinkCard,
  BlockColors,
  Markdown.configure({ html: true }),
]
