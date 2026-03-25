import { Editor, useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'
import { ReactElement } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ImagePopperForm from './ImagePopperForm'
import LinkPopperForm from './LinkPopperForm'

import { Typography } from '../Typography'

export {
  TOOLBAR_LINK_INPUT_TEST_ID,
  TOOLBAR_LINK_APPLY_BUTTON_TEST_ID,
  TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID,
} from './LinkPopperForm'

export const TOOLBAR_CONTAINER_TEST_ID = 'toolbar-container'
export const TOOLBAR_UNDO_BUTTON_TEST_ID = 'toolbar-undo-button'
export const TOOLBAR_REDO_BUTTON_TEST_ID = 'toolbar-redo-button'
export const TOOLBAR_BOLD_BUTTON_TEST_ID = 'toolbar-bold-button'
export const TOOLBAR_ITALIC_BUTTON_TEST_ID = 'toolbar-italic-button'
export const TOOLBAR_UNDERLINE_BUTTON_TEST_ID = 'toolbar-underline-button'
export const TOOLBAR_STRIKE_BUTTON_TEST_ID = 'toolbar-strike-button'
export const TOOLBAR_CODE_BUTTON_TEST_ID = 'toolbar-code-button'
export const TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID = 'toolbar-highlight-button'
export const TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID = 'toolbar-superscript-button'
export const TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID = 'toolbar-subscript-button'
export const TOOLBAR_TABLE_BUTTON_TEST_ID = 'toolbar-table-button'
export const TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID = 'toolbar-code-block-button'
export const TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID = 'toolbar-text-styling-dropdown'
export const TOOLBAR_LIST_DROPDOWN_TEST_ID = 'toolbar-list-dropdown'
export const TOOLBAR_ALIGN_DROPDOWN_TEST_ID = 'toolbar-align-dropdown'
export const TOOLBAR_IMAGE_BUTTON_TEST_ID = 'toolbar-image-button'

type ToolbarProps = {
  editor: Editor
}

type DropdownItem = {
  name: string
  value: string
  label?: string
  isActive: boolean
  onButtonClick: () => void
}

const Separator = () => <div className="mx-1 w-px bg-grey-300" />

const ToolbarDropdown = ({
  items,
  opener,
  'data-test': dataTest,
}: {
  items: DropdownItem[]
  opener: ReactElement
  'data-test'?: string
}) => (
  <Popper PopperProps={{ placement: 'bottom-start' }} opener={opener}>
    {({ closePopper }) => (
      <MenuPopper>
        {items.map((item) => (
          <Button
            key={item.value}
            data-test={dataTest ? `${dataTest}-${item.value}` : undefined}
            variant="quaternary"
            align="left"
            onClick={() => {
              item.onButtonClick()
              closePopper()
            }}
          >
            <div className="flex items-center gap-2">
              {item.label && <Typography>{item.label}</Typography>}
              <Typography color="grey700">{item.name}</Typography>
              {item.isActive && <Icon name="checkmark" />}
            </div>
          </Button>
        ))}
      </MenuPopper>
    )}
  </Popper>
)

const Toolbar = ({ editor }: ToolbarProps) => {
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      isUnderline: e.isActive('underline'),
      isStrike: e.isActive('strike'),
      isParagraph: e.isActive('paragraph'),
      isBulletList: e.isActive('bulletList'),
      isOrderedList: e.isActive('orderedList'),
      isCode: e.isActive('code'),
      isCodeBlock: e.isActive('codeBlock'),
      isH1: e.isActive('heading', { level: 1 }),
      isH2: e.isActive('heading', { level: 2 }),
      isH3: e.isActive('heading', { level: 3 }),
      isLink: e.isActive('link'),
      isSuperscript: e.isActive('superscript'),
      isSubscript: e.isActive('subscript'),
      isHighlight: e.isActive('highlight'),
      isAlignLeft: e.isActive({ textAlign: 'left' }),
      isAlignCenter: e.isActive({ textAlign: 'center' }),
      isAlignRight: e.isActive({ textAlign: 'right' }),
      isAlignJustify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const textStylings: DropdownItem[] = [
    {
      name: 'Paragraph',
      value: 'paragraph',
      label: 'T',
      isActive: editorState.isParagraph,
      onButtonClick: () => editor.chain().focus().setParagraph().run(),
    },
    {
      name: 'Heading 1',
      value: 'heading-1',
      label: 'H1',
      isActive: editorState.isH1,
      onButtonClick: () => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
      name: 'Heading 2',
      value: 'heading-2',
      label: 'H2',
      isActive: editorState.isH2,
      onButtonClick: () => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
      name: 'Heading 3',
      value: 'heading-3',
      label: 'H3',
      isActive: editorState.isH3,
      onButtonClick: () => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
  ]

  const listStylings: DropdownItem[] = [
    {
      name: 'Bullet List',
      value: 'bulletList',
      label: '•',
      isActive: editorState.isBulletList,
      onButtonClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      name: 'Ordered List',
      value: 'orderedList',
      label: '1.',
      isActive: editorState.isOrderedList,
      onButtonClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ]

  const alignments: DropdownItem[] = [
    {
      name: 'Left',
      value: 'left',
      isActive: editorState.isAlignLeft,
      onButtonClick: () => editor.chain().focus().setTextAlign('left').run(),
    },
    {
      name: 'Center',
      value: 'center',
      isActive: editorState.isAlignCenter,
      onButtonClick: () => editor.chain().focus().setTextAlign('center').run(),
    },
    {
      name: 'Right',
      value: 'right',
      isActive: editorState.isAlignRight,
      onButtonClick: () => editor.chain().focus().setTextAlign('right').run(),
    },
    {
      name: 'Justify',
      value: 'justify',
      isActive: editorState.isAlignJustify,
      onButtonClick: () => editor.chain().focus().setTextAlign('justify').run(),
    },
  ]

  const inlineFormattings = [
    {
      testId: TOOLBAR_BOLD_BUTTON_TEST_ID,
      isActive: editorState.isBold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      children: 'B',
    },
    {
      testId: TOOLBAR_ITALIC_BUTTON_TEST_ID,
      isActive: editorState.isItalic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      children: 'I',
    },
    {
      testId: TOOLBAR_UNDERLINE_BUTTON_TEST_ID,
      isActive: editorState.isUnderline,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      children: 'U',
    },
    {
      testId: TOOLBAR_STRIKE_BUTTON_TEST_ID,
      isActive: editorState.isStrike,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      children: 'S',
    },
    {
      testId: TOOLBAR_CODE_BUTTON_TEST_ID,
      isActive: editorState.isCode,
      onClick: () => editor.chain().focus().toggleCode().run(),
      children: '<>',
    },
    {
      testId: TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID,
      isActive: editorState.isHighlight,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      children: <Icon name="sparkles" />,
    },
    {
      testId: TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID,
      isActive: editorState.isSuperscript,
      onClick: () => editor.chain().focus().toggleSuperscript().run(),
      children: (
        <>
          X<sup className="text-[8px]">2</sup>
        </>
      ),
    },
    {
      testId: TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID,
      isActive: editorState.isSubscript,
      onClick: () => editor.chain().focus().toggleSubscript().run(),
      children: (
        <>
          X<sub className="text-[8px]">2</sub>
        </>
      ),
    },
  ]

  const activeTextLabel = textStylings.find((s) => s.isActive)?.label ?? 'M'
  const activeListLabel = listStylings.find((s) => s.isActive)?.label ?? '•'

  return (
    <div
      data-test={TOOLBAR_CONTAINER_TEST_ID}
      className="sticky top-0 z-10 flex flex-wrap gap-1 bg-white p-2 shadow-b"
    >
      {/* Undo / Redo */}
      <Button
        data-test={TOOLBAR_UNDO_BUTTON_TEST_ID}
        variant="secondary"
        disabled={!editorState.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        Undo
      </Button>
      <Button
        data-test={TOOLBAR_REDO_BUTTON_TEST_ID}
        variant="secondary"
        disabled={!editorState.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        Redo
      </Button>

      <Separator />

      {/* Text styling dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}
        items={textStylings}
        opener={
          <Button
            data-test={TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}
            variant="secondary"
            endIcon="chevron-down"
          >
            {activeTextLabel}
          </Button>
        }
      />

      {/* Inline formatting */}
      {inlineFormattings.map((fmt) => (
        <Button
          key={fmt.testId}
          data-test={fmt.testId}
          variant={fmt.isActive ? 'primary' : 'secondary'}
          onClick={fmt.onClick}
        >
          {fmt.children}
        </Button>
      ))}

      <Separator />

      {/* List dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_LIST_DROPDOWN_TEST_ID}
        items={listStylings}
        opener={
          <Button
            data-test={TOOLBAR_LIST_DROPDOWN_TEST_ID}
            variant={
              editorState.isBulletList || editorState.isOrderedList ? 'primary' : 'secondary'
            }
            endIcon="chevron-down"
          >
            {activeListLabel}
          </Button>
        }
      />

      {/* Text align dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_ALIGN_DROPDOWN_TEST_ID}
        items={alignments}
        opener={
          <Button
            data-test={TOOLBAR_ALIGN_DROPDOWN_TEST_ID}
            variant="secondary"
            endIcon="chevron-down"
          >
            <Icon name="content-left-align" />
          </Button>
        }
      />

      <Separator />

      {/* Link */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button variant={editorState.isLink ? 'primary' : 'secondary'}>
            <Icon name="link" />
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            <LinkPopperForm editor={editor} closePopper={closePopper} />
          </MenuPopper>
        )}
      </Popper>

      <Separator />

      {/* Table */}
      <Button
        data-test={TOOLBAR_TABLE_BUTTON_TEST_ID}
        variant="secondary"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        Table
      </Button>
      <Button
        data-test={TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID}
        variant={editorState.isCodeBlock ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        Code
      </Button>

      {/* Image */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button data-test={TOOLBAR_IMAGE_BUTTON_TEST_ID} variant="secondary">
            Image
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            <ImagePopperForm editor={editor} closePopper={closePopper} />
          </MenuPopper>
        )}
      </Popper>
    </div>
  )
}

export default Toolbar
