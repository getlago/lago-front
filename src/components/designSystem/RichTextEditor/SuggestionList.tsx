import type { SuggestionKeyDownProps } from '@tiptap/suggestion'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

export const SUGGESTION_LIST_CONTAINER_TEST_ID = 'suggestion-list-container'
export const SUGGESTION_LIST_ITEM_TEST_ID = 'suggestion-list-item'

export interface SuggestionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface SuggestionListProps<T> {
  items: T[]
  command: (item: T) => void
  getKey: (item: T) => string
  getLabel: (item: T) => string
  containerTestId?: string
  itemTestId?: string
}

function SuggestionListInner<T>(
  {
    items,
    command,
    getKey,
    getLabel,
    containerTestId = SUGGESTION_LIST_CONTAINER_TEST_ID,
    itemTestId = SUGGESTION_LIST_ITEM_TEST_ID,
  }: SuggestionListProps<T>,
  ref: React.ForwardedRef<SuggestionListRef>,
) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => setSelectedIndex(0), [items])

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const setItemRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      itemRefs.current[index] = el
    },
    [],
  )

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
      data-test={containerTestId}
      className="max-h-64 w-64 overflow-y-auto rounded-xl bg-grey-100 shadow-md"
    >
      <MenuPopper>
        {items.map((item, index) => (
          <Button
            ref={setItemRef(index)}
            key={getKey(item)}
            data-test={`${itemTestId}-${index}`}
            variant={index === selectedIndex ? 'secondary' : 'quaternary'}
            align="left"
            fullWidth
            onClick={() => command(item)}
          >
            <Typography variant="bodyHl" color="grey700">
              {getLabel(item)}
            </Typography>
          </Button>
        ))}
      </MenuPopper>
    </div>
  )
}

export const SuggestionList = forwardRef(SuggestionListInner) as <T>(
  props: SuggestionListProps<T> & { ref?: React.Ref<SuggestionListRef> },
) => React.ReactElement | null
