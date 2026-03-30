import { Editor, useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'

import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ToolbarButton from './ToolbarButton'
import ToolbarDropdown from './ToolbarDropdown'
import { DropdownItem } from './types'

import ImagePopperForm from '../ImagePopperForm'
import LinkPopperForm from '../LinkPopperForm'

export {
  TOOLBAR_LINK_INPUT_TEST_ID,
  TOOLBAR_LINK_APPLY_BUTTON_TEST_ID,
  TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID,
} from '../LinkPopperForm'

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

const Separator = () => <div className="mx-1 w-px bg-grey-300" />

const Toolbar = ({ editor }: ToolbarProps) => {
  const { translate } = useInternationalization()
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
      tooltip: translate('text_177486247001920oltp5jiat'),
      isActive: editorState.isBold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      children: 'B',
    },
    {
      testId: TOOLBAR_ITALIC_BUTTON_TEST_ID,
      tooltip: translate('text_1774862470019jznh75t0a6d'),
      isActive: editorState.isItalic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      children: 'I',
    },
    {
      testId: TOOLBAR_UNDERLINE_BUTTON_TEST_ID,
      tooltip: translate('text_1774862470019g91vhwcvp6a'),
      isActive: editorState.isUnderline,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      children: 'U',
    },
    {
      testId: TOOLBAR_STRIKE_BUTTON_TEST_ID,
      tooltip: translate('text_17748624700198fag2st68bl'),
      isActive: editorState.isStrike,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      children: 'S',
    },
    {
      testId: TOOLBAR_CODE_BUTTON_TEST_ID,
      tooltip: translate('text_1774862470019tg1a4fvcdhz'),
      isActive: editorState.isCode,
      onClick: () => editor.chain().focus().toggleCode().run(),
      children: '<>',
    },
    {
      testId: TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID,
      tooltip: translate('text_1774862470019yaqfus5r0ne'),
      isActive: editorState.isHighlight,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      children: <Icon name="sparkles-base" />,
    },
    {
      testId: TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID,
      tooltip: translate('text_1774862470019bbd9uyzn6ny'),
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
      tooltip: translate('text_17748624700194n6kgjpso8u'),
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
      <ToolbarButton
        testId={TOOLBAR_UNDO_BUTTON_TEST_ID}
        tooltip={translate('text_1774862470018jqdazc278y0')}
        isActive={false}
        onClick={() => editor.chain().focus().undo().run()}
        isDisabled={!editorState.canUndo}
      >
        <Icon name="arrow-left" />
      </ToolbarButton>
      <ToolbarButton
        testId={TOOLBAR_REDO_BUTTON_TEST_ID}
        tooltip={translate('text_1774862470019a0txge16qpr')}
        isActive={false}
        onClick={() => editor.chain().focus().redo().run()}
        isDisabled={!editorState.canRedo}
      >
        <Icon name="arrow-right" />
      </ToolbarButton>

      <Separator />

      {/* Text styling dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}
        items={textStylings}
        opener={
          <ToolbarButton
            testId={TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}
            tooltip={translate('text_1774862470019c5cxqnwghwv')}
            isActive={false}
            isPopper={true}
          >
            {activeTextLabel}
          </ToolbarButton>
        }
      />

      {/* Inline formatting */}
      {inlineFormattings.map((fmt) => (
        <ToolbarButton
          key={fmt.testId}
          testId={fmt.testId}
          tooltip={fmt.tooltip}
          isActive={fmt.isActive}
          onClick={fmt.onClick}
        >
          {fmt.children}
        </ToolbarButton>
      ))}

      <Separator />

      {/* List dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_LIST_DROPDOWN_TEST_ID}
        items={listStylings}
        opener={
          <ToolbarButton
            testId={TOOLBAR_LIST_DROPDOWN_TEST_ID}
            tooltip={translate('text_17748624700195ha5fimzytn')}
            isActive={editorState.isBulletList || editorState.isOrderedList}
            isPopper={true}
          >
            {activeListLabel}
          </ToolbarButton>
        }
      />

      {/* Text align dropdown */}
      <ToolbarDropdown
        data-test={TOOLBAR_ALIGN_DROPDOWN_TEST_ID}
        items={alignments}
        opener={
          <ToolbarButton
            testId={TOOLBAR_ALIGN_DROPDOWN_TEST_ID}
            tooltip={translate('text_1774862470019g2eqwp7925i')}
            isActive={false}
            isPopper={true}
          >
            <Icon name="content-left-align" />
          </ToolbarButton>
        }
      />

      <Separator />

      {/* Link */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <ToolbarButton
            testId="toolbar-link-button"
            tooltip={translate('text_1774862470019o9kt9r7s0e8')}
            isActive={editorState.isLink}
            isPopper={true}
          >
            <Icon name="link" />
          </ToolbarButton>
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
      <ToolbarButton
        testId={TOOLBAR_TABLE_BUTTON_TEST_ID}
        tooltip={translate('text_1774862470019b9gczrfwx0i')}
        isActive={false}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Icon name="table-horizontale" />
      </ToolbarButton>
      <ToolbarButton
        testId={TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID}
        tooltip={translate('text_1774862470019wdgkt31dezy')}
        isActive={editorState.isCodeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Icon name="code" />
      </ToolbarButton>

      {/* Image */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <ToolbarButton
            testId={TOOLBAR_IMAGE_BUTTON_TEST_ID}
            tooltip={translate('text_1774862470019f83anhhatsg')}
            isActive={false}
            isPopper={true}
          >
            <Icon name="image" />
          </ToolbarButton>
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
