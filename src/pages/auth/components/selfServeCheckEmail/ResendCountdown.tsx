import { useEffect, useState } from 'react'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatCountdown } from './utils'

type ResendCountdownProps = {
  endsAt: number
  onEnd: () => void
}

// Ticks on its own, so only this label re-renders every second
export const ResendCountdown = ({ endsAt, onEnd }: ResendCountdownProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now()

      // Ends in place of the tick that would read 0:00
      if (currentTime >= endsAt) return onEnd()

      setNow(currentTime)
    }, 1000)

    return (): void => clearInterval(interval)
  }, [endsAt, onEnd])

  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000))

  return <>{translate('text_1793906497618kzry1vugrrb', { time: formatCountdown(seconds) })}</>
}
