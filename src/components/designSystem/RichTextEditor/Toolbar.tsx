import { Editor, useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import { Typography } from '../Typography'

type ToolbarProps = {
  editor: Editor
}

const Separator = () => <div className="mx-1 w-px bg-grey-300" />

const Toolbar = ({ editor }: ToolbarProps) => {
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      isParagraph: e.isActive('paragraph'),
      isBulletList: e.isActive('bulletList'),
      isH1: e.isActive('heading', { level: 1 }),
      isH2: e.isActive('heading', { level: 2 }),
      isH3: e.isActive('heading', { level: 3 }),
      isHeading: e.isActive('heading'),
    }),
  })

  const possibleTextStylings = [
    {
      name: 'Paragraph',
      value: 'paragraph',
      label: 'T',
      isActive: editorState.isParagraph,
      onButtonClick: () => {
        editor.chain().focus().setParagraph().run()
      },
    },
    {
      name: 'Heading 1',
      value: 'heading-1',
      label: 'H1',
      isActive: editorState.isH1,
      onButtonClick: () => {
        editor.chain().focus().setHeading({ level: 1 }).run()
      },
    },
    {
      name: 'Heading 2',
      value: 'heading-2',
      label: 'H2',
      isActive: editorState.isH2,
      onButtonClick: () => {
        editor.chain().focus().setHeading({ level: 2 }).run()
      },
    },
    {
      name: 'Heading 3',
      value: 'heading-3',
      label: 'H3',
      isActive: editorState.isH3,
      onButtonClick: () => {
        editor.chain().focus().setHeading({ level: 3 }).run()
      },
    },
  ]

  const getActualTextStyling = () => {
    if (editorState.isH1) return 'heading-1'
    if (editorState.isH2) return 'heading-2'
    if (editorState.isH3) return 'heading-3'
    if (editorState.isParagraph) return 'paragraph'
    return 'multiple'
  }

  const actualTextStylingLabel =
    possibleTextStylings.find((s) => s.value === getActualTextStyling())?.label ?? 'M'

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-1 bg-white p-2 shadow-b">
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button variant="secondary" endIcon="chevron-down">
            {actualTextStylingLabel}
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            {possibleTextStylings.map((styling) => (
              <Button
                key={styling.value}
                variant="quaternary"
                align="left"
                onClick={() => {
                  styling.onButtonClick()
                  closePopper()
                }}
              >
                <div className="flex items-center gap-2">
                  <Typography>{styling.label}</Typography>
                  <Typography color="grey700">{styling.name}</Typography>
                  {styling.isActive && <Icon name="checkmark" />}
                </div>
              </Button>
            ))}
          </MenuPopper>
        )}
      </Popper>
      {/* Inline formatting */}
      <Button
        variant={editorState.isBold ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        variant={editorState.isItalic ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>

      <Separator />

      {/* Lists */}
      <Button
        variant={editorState.isBulletList ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        List
      </Button>

      <Separator />

      {/* Link */}
      {/* <button
        onClick={() => {
          const url = window.prompt('URL:')

          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={`rounded px-3 py-1 text-sm ${
          editor.isActive('link') ? 'bg-grey-800 text-white' : 'bg-grey-100'
        }`}
      >
        Link
      </button> */}

      {/* Table */}
      <Button
        variant={'secondary'}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        Table
      </Button>

      {/* Image */}
      {/* <button
        onClick={() => {
          const url = window.prompt('Image URL:')

          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}
        className="bg-grey-100 rounded px-3 py-1 text-sm"
      >
        Image
      </button> */}
    </div>
  )
}

export default Toolbar
