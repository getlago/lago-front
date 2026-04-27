import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

export const GROUP_NAMES = ['undoRedo', 'textStyling', 'lists', 'alignment', 'media'] as const

export type GroupName = (typeof GROUP_NAMES)[number]

type UseToolbarOverflowParams = {
  containerRef: RefObject<HTMLDivElement | null>
  groupRefs: Record<GroupName, RefObject<HTMLDivElement | null>>
  kebabRef: RefObject<HTMLDivElement | null>
  gap: number // gap in px between groups (Tailwind gap-2 = 8px)
}

type UseToolbarOverflowReturn = {
  visibleGroups: Set<GroupName>
  overflowedGroups: GroupName[]
  hasOverflow: boolean
}

export const useToolbarOverflow = ({
  containerRef,
  groupRefs,
  kebabRef,
  gap,
}: UseToolbarOverflowParams): UseToolbarOverflowReturn => {
  const [visibleGroups, setVisibleGroups] = useState<Set<GroupName>>(new Set(GROUP_NAMES))
  const rafId = useRef<number>(0)
  const widthCache = useRef<Map<GroupName, number>>(new Map())

  const calculate = useCallback(() => {
    const container = containerRef.current

    if (!container) return

    const containerWidth = container.clientWidth
    const kebabWidth = kebabRef.current?.scrollWidth ?? 0

    let usedWidth = 0
    const newVisible = new Set<GroupName>()
    let overflowing = false

    for (const name of GROUP_NAMES) {
      if (overflowing) break

      const el = groupRefs[name].current
      let groupWidth: number

      if (el) {
        groupWidth = el.scrollWidth
        widthCache.current.set(name, groupWidth)
      } else {
        const cached = widthCache.current.get(name)

        if (cached === undefined) continue // never measured, skip
        groupWidth = cached
      }

      // Add gap before this group if it's not the first
      const additionalGap = newVisible.size > 0 ? gap : 0
      // Reserve space for kebab + its gap if we might overflow
      const remainingGroups = GROUP_NAMES.length - newVisible.size - 1
      const kebabReserve = remainingGroups > 0 ? kebabWidth + gap : 0

      if (usedWidth + additionalGap + groupWidth + kebabReserve > containerWidth) {
        overflowing = true
        break
      }

      usedWidth += additionalGap + groupWidth
      newVisible.add(name)
    }

    setVisibleGroups((prev) => {
      // Avoid unnecessary re-renders if the sets are identical
      if (prev.size === newVisible.size && Array.from(prev).every((g) => newVisible.has(g))) {
        return prev
      }

      return newVisible
    })
  }, [containerRef, groupRefs, kebabRef, gap])

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(calculate)
    })

    observer.observe(container)

    // Initial calculation
    calculate()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId.current)
    }
  }, [containerRef, calculate])

  const overflowedGroups = GROUP_NAMES.filter((name) => !visibleGroups.has(name))

  return {
    visibleGroups,
    overflowedGroups,
    hasOverflow: overflowedGroups.length > 0,
  }
}
