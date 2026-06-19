import { useVirtualizer } from '@tanstack/react-virtual'
import { Fragment, ReactNode, useLayoutEffect, useRef, useState } from 'react'

import { findNearestScrollableAncestor } from './findNearestScrollableAncestor'

export const VIRTUALIZATION_THRESHOLD = 50

export type VirtualFilterListProps<T> = {
  items: ReadonlyArray<T>
  renderItem: (item: T, index: number) => ReactNode
  getItemKey: (item: T, index: number) => string
  estimateItemHeight: number
  className?: string
  // Vertical spacing between rows, in px. In the plain (below-threshold) branch
  // this is supplied by the `className` flex gap; in the virtualized branch flex
  // gap does not apply to the absolutely-positioned rows, so it is baked into
  // each row's paddingBottom (and thus into its measured height) instead.
  gap?: number
  threshold?: number
  overscan?: number
  getScrollElement?: () => HTMLElement | null
}

export const VirtualFilterList = <T,>({
  items,
  renderItem,
  getItemKey,
  estimateItemHeight,
  className,
  gap = 0,
  threshold = VIRTUALIZATION_THRESHOLD,
  overscan = 6,
  getScrollElement,
}: VirtualFilterListProps<T>) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const getScrollElementRef = useRef(getScrollElement)

  getScrollElementRef.current = getScrollElement

  const isVirtualized = items.length > threshold

  useLayoutEffect(() => {
    if (!isVirtualized) return

    const resolve = () => {
      const element = getScrollElementRef.current
        ? getScrollElementRef.current()
        : findNearestScrollableAncestor(rootRef.current)

      setScrollElement(element)

      if (element && rootRef.current) {
        const listRect = rootRef.current.getBoundingClientRect()
        const scrollRect = element.getBoundingClientRect()

        setScrollMargin(listRect.top - scrollRect.top + element.scrollTop)
      } else {
        setScrollMargin(0)
      }
    }

    resolve()
    window.addEventListener('resize', resolve)

    // Recompute when any content above the list changes height (e.g. an accordion
    // expanding) without triggering a window resize event.
    const resolvedElement = getScrollElementRef.current
      ? getScrollElementRef.current()
      : findNearestScrollableAncestor(rootRef.current)

    let resizeObserver: ResizeObserver | null = null

    if (resolvedElement) {
      resolvedElement.addEventListener('scroll', resolve, { passive: true })
      resizeObserver = new ResizeObserver(resolve)
      resizeObserver.observe(resolvedElement)
    }

    return () => {
      window.removeEventListener('resize', resolve)
      if (resolvedElement) {
        resolvedElement.removeEventListener('scroll', resolve)
      }
      resizeObserver?.disconnect()
    }
  }, [isVirtualized, items.length])

  const virtualizer = useVirtualizer({
    count: isVirtualized ? items.length : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateItemHeight,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan,
    scrollMargin,
  })

  if (!isVirtualized) {
    return (
      <div ref={rootRef} className={className}>
        {items.map((item, index) => (
          <Fragment key={getItemKey(item, index)}>{renderItem(item, index)}</Fragment>
        ))}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={className}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]
          const isLastItem = virtualRow.index === items.length - 1

          return (
            <div
              key={getItemKey(item, virtualRow.index)}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                // Bake the inter-row gap into the measured height (no trailing
                // gap after the last row, matching flex `gap` behavior).
                paddingBottom: isLastItem ? 0 : gap,
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
