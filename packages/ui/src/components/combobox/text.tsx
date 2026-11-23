import * as React from 'react'

import { middleTruncate } from '../../lib/middle-truncate'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'

export const ComboboxText = ({
  children,
  className,
}: {
  children: string
  className?: string
}): React.ReactElement => {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [text, setText] = React.useState(children)

  React.useLayoutEffect(() => {
    const element = ref.current

    if (!element) return
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return
    const measure = (): void => {
      const style = getComputedStyle(element)

      context.font = style.font
      const spacing = Number.parseFloat(style.letterSpacing) || 0

      setText(
        middleTruncate(
          children,
          (value) =>
            context.measureText(value).width + value.length * spacing <= element.clientWidth,
        ),
      )
    }
    const observer = new ResizeObserver(measure)

    observer.observe(element)
    let mounted = true

    void document.fonts?.ready.then(() => {
      if (mounted) measure()
    })
    measure()
    return (): void => {
      mounted = false
      observer.disconnect()
    }
  }, [children])
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          onCopy={(event) => {
            event.clipboardData.setData('text/plain', children)
            event.preventDefault()
          }}
          className={cn('min-w-0 flex-1 overflow-hidden whitespace-nowrap', className)}
          data-full-text={children}
          aria-label={children}
        >
          <span aria-hidden="true">{text}</span>
        </span>
      </TooltipTrigger>
      {text !== children && <TooltipContent>{children}</TooltipContent>}
    </Tooltip>
  )
}
