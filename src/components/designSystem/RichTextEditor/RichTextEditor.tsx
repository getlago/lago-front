import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { SlashCommands } from './extensions/SlashCommands'
import './richTextEditor.css'
import Toolbar from './Toolbar'

const RichTextEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
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
    <div className="rich-text-editor relative h-full max-h-screen overflow-auto">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
