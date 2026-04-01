import type { Editor } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { useEditorState } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ColorPicker from './ColorPicker'

export const BLOCK_TOOLBAR_TEST_ID = 'block-toolbar'
export const BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID = 'block-toolbar-delete-button'
export const BLOCK_TOOLBAR_BG_COLOR_BUTTON_TEST_ID = 'block-toolbar-bg-color-button'
export const BLOCK_TOOLBAR_TEXT_COLOR_BUTTON_TEST_ID = 'block-toolbar-text-color-button'

type BlockToolbarProps = {
  editor: Editor
}

const BlockToolbar = ({ editor }: BlockToolbarProps) => {
  const { translate } = useInternationalization()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const blockSelection = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { selection } = e.state

      if (selection instanceof NodeSelection && !e.view.dragging) {
        return {
          pos: selection.from,
          node: selection.node,
          backgroundColor:
            typeof selection.node.attrs.backgroundColor === 'string'
              ? selection.node.attrs.backgroundColor
              : null,
          textColor:
            typeof selection.node.attrs.textColor === 'string'
              ? selection.node.attrs.textColor
              : null,
        }
      }

      return null
    },
  })

  useEffect(() => {
    if (!blockSelection) {
      setPosition(null)

      return
    }

    const dom = editor.view.nodeDOM(blockSelection.pos)

    if (!dom || !(dom instanceof HTMLElement)) {
      setPosition(null)

      return
    }

    const editorContainer = editor.view.dom.closest('.rich-text-editor')

    if (!editorContainer) {
      setPosition(null)

      return
    }

    const containerRect = editorContainer.getBoundingClientRect()
    const blockRect = dom.getBoundingClientRect()

    setPosition({
      top: blockRect.top - containerRect.top,
      left: blockRect.left - containerRect.left,
    })
  }, [editor, blockSelection])

  if (!blockSelection || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="absolute z-20 flex flex-col gap-1 rounded-xl border border-grey-200 bg-white p-2 shadow-md"
      style={{ top: position.top, left: position.left }}
      data-test={BLOCK_TOOLBAR_TEST_ID}
    >
      {/* Delete */}
      <Button
        variant="quaternary"
        startIcon="trash"
        size="small"
        align="left"
        data-test={BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID}
        onClick={() => editor.commands.deleteSelection()}
      >
        {translate('text_63ea0f84f400488553caa786')}
      </Button>

      {/* Background color */}
      <Popper
        PopperProps={{ placement: 'right-start' }}
        opener={
          <Button
            variant="quaternary"
            size="small"
            align="left"
            className="w-full"
            data-test={BLOCK_TOOLBAR_BG_COLOR_BUTTON_TEST_ID}
          >
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded border border-grey-300"
                style={{ backgroundColor: blockSelection.backgroundColor ?? '#ffffff' }}
              />
              <span>{translate('text_1774969464357ic1jobm2vtd')}</span>
            </div>
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            <ColorPicker
              variant="background"
              activeColor={blockSelection.backgroundColor}
              onSelect={(color) => {
                editor.commands.setBlockBackgroundColor(color)
                closePopper()
              }}
            />
          </MenuPopper>
        )}
      </Popper>

      {/* Text color */}
      <Popper
        PopperProps={{ placement: 'right-start' }}
        opener={
          <Button
            variant="quaternary"
            size="small"
            align="left"
            className="w-full"
            data-test={BLOCK_TOOLBAR_TEXT_COLOR_BUTTON_TEST_ID}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: blockSelection.textColor ?? '#000000' }}
              >
                A
              </span>
              <span>{translate('text_1774969464357oo1dfrfw06m')}</span>
            </div>
          </Button>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            <ColorPicker
              variant="text"
              activeColor={blockSelection.textColor}
              onSelect={(color) => {
                editor.commands.setBlockTextColor(color)
                closePopper()
              }}
            />
          </MenuPopper>
        )}
      </Popper>
    </div>
  )
}

export default BlockToolbar
