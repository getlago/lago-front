import { useEffect, useRef, useState } from 'react'

import { prefersReducedMotion } from '~/components/subscriptions/realtimeUsage/common/utils'

import { CURRENT_HOUR_TWEEN_DURATION } from './constants'
import { HourPoint } from './types'
import { seriesValue } from './utils'

// Only the current hour can still move: every closed hour is a settled bucket
// sum. So the chart tweens that one column and leaves the rest alone —
// animating the whole chart on each poll would imply motion in data that is
// final. A new hour (or a shrinking value, meaning a corrected bucket) snaps.
export const useCurrentHourTween = (points: HourPoint[]): HourPoint[] => {
  const [displayPoints, setDisplayPoints] = useState<HourPoint[]>(points)
  const frameRef = useRef<number>()
  const fromRef = useRef<HourPoint | undefined>(undefined)

  useEffect(() => {
    const target = points.at(-1)
    const from = fromRef.current

    const snap = (): void => {
      fromRef.current = target
      setDisplayPoints(points)
    }

    if (!target || from?.time !== target.time || prefersReducedMotion()) {
      snap()

      return
    }

    const numericKeys = Object.keys(target).filter((key) => typeof target[key] === 'number')
    const hasGrown = numericKeys.some((key) => seriesValue(target, key) > seriesValue(from, key))

    if (!hasGrown) {
      snap()

      return
    }

    const start = performance.now()

    const step = (timestamp: number): void => {
      const progress = Math.min(1, (timestamp - start) / CURRENT_HOUR_TWEEN_DURATION)
      const eased = 1 - Math.pow(1 - progress, 3)
      const tweened: HourPoint = { ...target }

      numericKeys.forEach((key) => {
        const origin = seriesValue(from, key)

        tweened[key] = origin + (seriesValue(target, key) - origin) * eased
      })

      setDisplayPoints([...points.slice(0, -1), tweened])

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)

        return
      }

      fromRef.current = target
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [points])

  return displayPoints
}
