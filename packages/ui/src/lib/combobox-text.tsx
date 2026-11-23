import * as React from 'react'

import { middleTruncate } from './middle-truncate'

import { Tooltip, TooltipContent, TooltipTrigger } from '../components/tooltip'

export const ComboboxText = ({ text }: { text: string }): React.ReactElement => {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = React.useState(text)
  const [active, setActive] = React.useState(false)

  React.useLayoutEffect(() => {
    const element = ref.current

    if (!element) return
    const measure = (): void => {
      if (!element.clientWidth) {
        setDisplay(text)
        return
      }
      const style = getComputedStyle(element)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) return
      context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const spacing = Number.parseFloat(style.letterSpacing) || 0

      setDisplay(
        middleTruncate(
          text,
          element.clientWidth,
          (value) =>
            context.measureText(value).width + Math.max(0, Array.from(value).length - 1) * spacing,
        ),
      )
    }
    const observer = new ResizeObserver(measure)
    let mounted = true

    observer.observe(element)
    measure()
    void document.fonts?.ready.then(() => {
      if (mounted) measure()
    })
    document.fonts?.addEventListener('loadingdone', measure)

    return (): void => {
      mounted = false
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', measure)
    }
  }, [text])

  React.useEffect(() => {
    const element = ref.current
    const target =
      element?.closest<HTMLElement>('button, [role="option"], [data-slot="combobox-chip"]') ??
      element

    if (!target || display === text) return
    const focus = (): void => setActive(true)
    const blur = (): void => setActive(false)
    const highlight = (): void =>
      setActive(target.hasAttribute('data-highlighted') || target.matches(':focus-within'))
    const copy = (event: ClipboardEvent): void => {
      const labels = target.dataset.fullText
        ? [target]
        : target.querySelectorAll<HTMLElement>('[data-full-text]')

      event.clipboardData?.setData(
        'text/plain',
        Array.from(labels, (label) => label.dataset.fullText).join('\n'),
      )
      event.preventDefault()
    }
    const observer = new MutationObserver(highlight)

    observer.observe(target, { attributes: true, attributeFilter: ['data-highlighted'] })
    highlight()
    target.addEventListener('copy', copy)
    target.addEventListener('focusin', focus)
    target.addEventListener('focusout', blur)

    return (): void => {
      observer.disconnect()
      target.removeEventListener('copy', copy)
      target.removeEventListener('focusin', focus)
      target.removeEventListener('focusout', blur)
    }
  }, [display, text])

  return (
    <Tooltip open={display !== text && active}>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          data-full-text={text}
          className="v2-combobox-text"
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
        >
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">{display}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}
