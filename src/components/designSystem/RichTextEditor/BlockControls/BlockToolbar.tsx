import type { Editor } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ColorPicker from './ColorPicker'

type BlockToolbarProps = {
  editor: Editor
}

const BlockToolbar = ({ editor }: BlockToolbarProps) => {
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
      top: blockRect.top - containerRect.top - 40,
      left: blockRect.left - containerRect.left,
    })
  }, [editor, blockSelection])

  if (!blockSelection || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="absolute z-20 flex items-center gap-1 rounded-lg border border-grey-300 bg-white p-1 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      {/* Delete */}
      <Button
        variant="quaternary"
        danger
        icon="trash"
        size="small"
        onClick={() => editor.commands.deleteSelection()}
      />

      <div className="mx-0.5 h-6 w-px bg-grey-300" />

      {/* Background color */}
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button variant="quaternary" size="small">
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded border border-grey-300"
                style={{ backgroundColor: blockSelection.backgroundColor ?? '#ffffff' }}
              />
              <Icon name="chevron-down" size="small" />
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
        PopperProps={{ placement: 'bottom-start' }}
        opener={
          <Button variant="quaternary" size="small">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: blockSelection.textColor ?? '#000000' }}
              >
                A
              </span>
              <Icon name="chevron-down" size="small" />
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
