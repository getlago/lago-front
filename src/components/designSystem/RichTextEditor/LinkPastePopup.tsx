import { useCallback, useEffect, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

interface LinkPastePopupProps {
  url: string
  onDisplayAsCard: () => void
  onKeepAsText: () => void
}

const actions = ['displayAsCard', 'keepAsText'] as const

export const LinkPastePopup = ({ url, onDisplayAsCard, onKeepAsText }: LinkPastePopupProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const execute = useCallback(
    (index: number) => {
      if (actions[index] === 'displayAsCard') {
        onDisplayAsCard()
      } else {
        onKeepAsText()
      }
    },
    [onDisplayAsCard, onKeepAsText],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + actions.length) % actions.length)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % actions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        execute(selectedIndex)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, execute])

  return (
    <div className="w-72 overflow-hidden rounded-xl bg-white shadow-md">
      <MenuPopper>
        <div className="border-b border-grey-200 px-3 py-2">
          <Typography variant="captionHl" color="grey600" noWrap>
            {url}
          </Typography>
        </div>
        <Button
          variant={selectedIndex === 0 ? 'secondary' : 'quaternary'}
          align="left"
          fullWidth
          onClick={onDisplayAsCard}
        >
          <Typography variant="bodyHl" color="grey700">
            Display as card
          </Typography>
        </Button>
        <Button
          variant={selectedIndex === 1 ? 'secondary' : 'quaternary'}
          align="left"
          fullWidth
          onClick={onKeepAsText}
        >
          <Typography variant="bodyHl" color="grey700">
            Keep as text
          </Typography>
        </Button>
      </MenuPopper>
    </div>
  )
}
