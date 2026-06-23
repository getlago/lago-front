import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Fragment,
  MutableRefObject,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { findNearestScrollableAncestor } from './findNearestScrollableAncestor'

export const VIRTUALIZATION_THRESHOLD = 50

// Imperative handle for callers that must drive the list programmatically (e.g.
// jump-to-item navigation into a row that is currently scrolled out and unmounted).
// `isVirtualized` lets the caller pick its path: when false the row is mounted, so
// the caller can resolve it directly (getElementById) instead of scrollToIndex.
export type VirtualListApi = {
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void
  isVirtualized: boolean
}

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
  // Populated with the imperative handle while mounted, cleared on unmount.
  apiRef?: MutableRefObject<VirtualListApi | null>
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
  apiRef,
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
    // Include the gap: each rendered row bakes the inter-row gap into its measured
    // height (paddingBottom below), so an estimate without it makes the spacer
    // under-reserve space by `gap` per not-yet-measured row. That shortfall pushes
    // any anchor below the list (e.g. a sibling section the sidebar jumps to) far
    // above its real position, so scrollIntoView lands short.
    estimateSize: () => estimateItemHeight + gap,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan,
    scrollMargin,
  })

  // Expose the imperative handle so callers can drive the list (jump-to-item). The
  // virtualizer instance is stable, so this only needs to re-sync when the branch
  // (virtualized vs plain) flips.
  useEffect(() => {
    if (!apiRef) return

    apiRef.current = {
      scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
      isVirtualized,
    }

    return () => {
      apiRef.current = null
    }
  }, [apiRef, isVirtualized, virtualizer])

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
