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
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { SlashCommands } from './extensions/SlashCommands'
import './richTextEditor.css'
import Toolbar from './Toolbar'

export const RICH_TEXT_EDITOR_TEST_ID = 'rich-text-editor'
export const RICH_TEXT_EDITOR_TOOLBAR_TEST_ID = 'rich-text-editor-toolbar'
export const RICH_TEXT_EDITOR_CONTENT_TEST_ID = 'rich-text-editor-content'

const RichTextEditor = () => {
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
      }),
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
    <div
      data-test={RICH_TEXT_EDITOR_TEST_ID}
      className="rich-text-editor relative h-full max-h-screen overflow-auto"
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
