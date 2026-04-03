import type { Editor } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { useEditorState } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ColorPicker from './ColorPicker'

export const BLOCK_TOOLBAR_TEST_ID = 'block-toolbar'
export const BLOCK_TOOLBAR_MOVE_UP_BUTTON_TEST_ID = 'block-toolbar-move-up-button'
export const BLOCK_TOOLBAR_MOVE_DOWN_BUTTON_TEST_ID = 'block-toolbar-move-down-button'
export const BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID = 'block-toolbar-delete-button'
export const BLOCK_TOOLBAR_COLOR_BUTTON_TEST_ID = 'block-toolbar-color-button'

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
        const $pos = e.state.doc.resolve(selection.from)
        const index = $pos.index(0)

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
          isFirst: index === 0,
          isLast: index >= e.state.doc.childCount - 1,
        }
      }

      return null
    },
  })

  const updatePosition = useCallback(() => {
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

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    if (!blockSelection) return

    const scrollContainer = editor.view.dom.closest('.rich-text-editor')

    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', updatePosition, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', updatePosition)
    }
  }, [editor, blockSelection, updatePosition])

  if (!blockSelection || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="absolute z-20 flex flex-col gap-1 rounded-xl border border-grey-200 bg-white p-2 shadow-md"
      style={{ top: position.top, left: position.left }}
      data-test={BLOCK_TOOLBAR_TEST_ID}
    >
      {/* Colors (background + text) */}
      <Popper
        PopperProps={{ placement: 'right-start' }}
        opener={
          <Button
            variant="quaternary"
            align="left"
            className="w-full"
            startIcon="text-color"
            data-test={BLOCK_TOOLBAR_COLOR_BUTTON_TEST_ID}
          >
            {translate('text_17751458820889ebguo3021w')}
          </Button>
        }
      >
        {() => (
          <MenuPopper>
            <ColorPicker
              activeBackgroundColor={blockSelection.backgroundColor}
              activeTextColor={blockSelection.textColor}
              onSelectBackground={(color) => {
                editor.commands.setBlockBackgroundColor(color)
              }}
              onSelectText={(color) => {
                editor.commands.setBlockTextColor(color)
              }}
            />
          </MenuPopper>
        )}
      </Popper>

      {/* Move up */}
      <Button
        variant="quaternary"
        startIcon="arrow-top"
        align="left"
        disabled={blockSelection.isFirst}
        data-test={BLOCK_TOOLBAR_MOVE_UP_BUTTON_TEST_ID}
        onClick={() => editor.commands.moveBlockUp()}
      >
        {translate('text_block_move_up')}
      </Button>

      {/* Move down */}
      <Button
        variant="quaternary"
        startIcon="arrow-bottom"
        align="left"
        disabled={blockSelection.isLast}
        data-test={BLOCK_TOOLBAR_MOVE_DOWN_BUTTON_TEST_ID}
        onClick={() => editor.commands.moveBlockDown()}
      >
        {translate('text_block_move_down')}
      </Button>

      {/* Delete */}
      <Button
        variant="quaternary"
        startIcon="trash"
        align="left"
        data-test={BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID}
        onClick={() => editor.commands.deleteSelection()}
      >
        {translate('text_1775145882088oj33ff13ddh')}
      </Button>
    </div>
  )
}

export default BlockToolbar
