import type { SuggestionKeyDownProps } from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import type { SlashCommandItem } from './extensions/SlashCommands'

export const SLASH_MENU_CONTAINER_TEST_ID = 'slash-menu-container'
export const SLASH_MENU_ITEM_TEST_ID = 'slash-menu-item'

export interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface SlashMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => setSelectedIndex(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        command(items[selectedIndex])
        return true
      }
      return false
    },
  }))

  if (!items.length) return null

  return (
    <div
      data-test={SLASH_MENU_CONTAINER_TEST_ID}
      className="max-h-64 w-64 overflow-y-auto rounded-xl bg-grey-100 shadow-md"
    >
      <MenuPopper>
        {items.map((item, index) => (
          <Button
            key={item.title}
            data-test={`${SLASH_MENU_ITEM_TEST_ID}-${index}`}
            variant={index === selectedIndex ? 'secondary' : 'quaternary'}
            align="left"
            fullWidth
            onClick={() => command(item)}
          >
            <Typography variant="bodyHl" color="grey700">
              {item.title}
            </Typography>
          </Button>
        ))}
      </MenuPopper>
    </div>
  )
})

SlashMenu.displayName = 'SlashMenu'
