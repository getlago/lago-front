import { Editor, useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import { Typography } from '../Typography'

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
export const TOOLBAR_LINK_APPLY_BUTTON_TEST_ID = 'toolbar-link-apply-button'
export const TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID = 'toolbar-link-remove-button'
export const TOOLBAR_LINK_INPUT_TEST_ID = 'toolbar-link-input'

type ToolbarProps = {
  editor: Editor
}

const Separator = () => <div className="mx-1 w-px bg-grey-300" />

const Toolbar = ({ editor }: ToolbarProps) => {
  const [linkInput, setLinkInput] = useState('')

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
      isHeading: e.isActive('heading'),
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

  const possibleListStylings = [
    {
      name: 'Bullet List',
      value: 'bulletList',
      label: '•',
      isActive: editorState.isBulletList,
      onButtonClick: () => {
        editor.chain().focus().toggleBulletList().run()
      },
    },
    {
      name: 'Ordered List',
      value: 'orderedList',
      label: '1.',
      isActive: editorState.isOrderedList,
      onButtonClick: () => {
        editor.chain().focus().toggleOrderedList().run()
      },
    },
  ]

  const possibleAlignments = [
    {
      name: 'Left',
      value: 'left',
      isActive: editorState.isAlignLeft,
      onButtonClick: () => {
        editor.chain().focus().setTextAlign('left').run()
      },
    },
    {
      name: 'Center',
      value: 'center',
      isActive: editorState.isAlignCenter,
      onButtonClick: () => {
        editor.chain().focus().setTextAlign('center').run()
      },
    },
    {
      name: 'Right',
      value: 'right',
      isActive: editorState.isAlignRight,
      onButtonClick: () => {
        editor.chain().focus().setTextAlign('right').run()
      },
    },
    {
      name: 'Justify',
      value: 'justify',
      isActive: editorState.isAlignJustify,
      onButtonClick: () => {
        editor.chain().focus().setTextAlign('justify').run()
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

  const getActualListStyling = () => {
    if (editorState.isBulletList) return 'bulletList'
    if (editorState.isOrderedList) return 'orderedList'
    return null
  }

  const actualTextStylingLabel =
    possibleTextStylings.find((s) => s.value === getActualTextStyling())?.label ?? 'M'

  const actualListLabel =
    possibleListStylings.find((s) => s.value === getActualListStyling())?.label ?? '•'

  const handleSetLink = (closePopper: () => void) => {
    if (linkInput) {
      editor
        .chain()
        .focus()
        .setLink({ href: linkInput.startsWith('http') ? linkInput : `https://${linkInput}` })
        .run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkInput('')
    closePopper()
  }

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
        data-test={TOOLBAR_BOLD_BUTTON_TEST_ID}
        variant={editorState.isBold ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        data-test={TOOLBAR_ITALIC_BUTTON_TEST_ID}
        variant={editorState.isItalic ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        data-test={TOOLBAR_UNDERLINE_BUTTON_TEST_ID}
        variant={editorState.isUnderline ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </Button>
      <Button
        data-test={TOOLBAR_STRIKE_BUTTON_TEST_ID}
        variant={editorState.isStrike ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </Button>
      <Button
        data-test={TOOLBAR_CODE_BUTTON_TEST_ID}
        variant={editorState.isCode ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {'<>'}
      </Button>
      <Button
        data-test={TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID}
        variant={editorState.isHighlight ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Icon name="sparkles" />
      </Button>

      <Separator />

      {/* Superscript / Subscript */}
      <Button
        data-test={TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID}
        variant={editorState.isSuperscript ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        X<sup className="text-[8px]">2</sup>
      </Button>
      <Button
        data-test={TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID}
        variant={editorState.isSubscript ? 'primary' : 'secondary'}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        X<sub className="text-[8px]">2</sub>
      </Button>

      <Separator />

      {/* List dropdown */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button
            variant={
              editorState.isBulletList || editorState.isOrderedList ? 'primary' : 'secondary'
            }
            endIcon="chevron-down"
          >
            {actualListLabel}
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            {possibleListStylings.map((styling) => (
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

      {/* Text align dropdown */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button variant="secondary" endIcon="chevron-down">
            <Icon name="content-left-align" />
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            {possibleAlignments.map((alignment) => (
              <Button
                key={alignment.value}
                variant="quaternary"
                align="left"
                onClick={() => {
                  alignment.onButtonClick()
                  closePopper()
                }}
              >
                <div className="flex items-center gap-2">
                  <Typography color="grey700">{alignment.name}</Typography>
                  {alignment.isActive && <Icon name="checkmark" />}
                </div>
              </Button>
            ))}
          </MenuPopper>
        )}
      </Popper>

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
            <div className="flex flex-col gap-2 p-3">
              <Typography variant="captionHl" color="grey700">
                URL
              </Typography>
              <input
                data-test={TOOLBAR_LINK_INPUT_TEST_ID}
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSetLink(closePopper)
                  }
                }}
                placeholder="https://example.com"
                className="rounded border border-grey-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600"
              />
              <div className="flex gap-2">
                <Button
                  data-test={TOOLBAR_LINK_APPLY_BUTTON_TEST_ID}
                  variant="primary"
                  onClick={() => handleSetLink(closePopper)}
                >
                  Apply
                </Button>
                {editorState.isLink && (
                  <Button
                    data-test={TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID}
                    variant="secondary"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setLinkInput('')
                      closePopper()
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </MenuPopper>
        )}
      </Popper>

      <Separator />

      {/* Table */}
      <Button
        data-test={TOOLBAR_TABLE_BUTTON_TEST_ID}
        variant={'secondary'}
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
    </div>
  )
}

export default Toolbar
