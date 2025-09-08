import { Button, Icon, Typography } from 'lago-design-system'
import { ReactNode } from 'react'

/**
 * Converts a number (in seconds) into a human-readable duration string
 * @param seconds - The duration in seconds
 * @returns A human-readable duration string (e.g., "2m 30s", "1h 15m", "45s")
 */
const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '0s'
  if (seconds === 0) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`)
  }

  return parts.join(' ')
}

const SentMessage = ({ children }: { children: ReactNode }) => {
  return (
    <Typography
      className="ml-7 whitespace-normal rounded-md border border-grey-300 bg-grey-100 px-3 py-2"
      variant="captionHl"
      color="grey700"
    >
      {children}
    </Typography>
  )
}

const ReceivedMessage = ({ children }: { children: ReactNode }) => {
  return (
    <Typography className="whitespace-normal" color="grey700">
      {children}
    </Typography>
  )
}

const LoadingMessage = () => {
  return <Icon name="sparkles-base" size="large" color="black" animation="spin" />
}

const ChipWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-grey-300 px-3 py-2">
      {children}
    </div>
  )
}

const ErrorMessage = ({ children, onAction }: { children: ReactNode; onAction?: () => void }) => {
  return (
    <ChipWrapper>
      <div className="flex items-center gap-2">
        <Icon name="error-unfilled" color="error" />
        <Typography variant="captionHl" color="danger600">
          {children}
        </Typography>
      </div>
      {!!onAction && (
        <Button size="small" variant="inline" onClick={onAction}>
          Retry
        </Button>
      )}
    </ChipWrapper>
  )
}

const InfoMessage = ({
  children,
  duration,
  isLoading,
}: {
  children: ReactNode
  duration?: number
  isLoading?: boolean
}) => {
  return (
    <ChipWrapper>
      <div className="flex items-center gap-2">
        <Icon
          name={isLoading ? 'processing' : 'checkmark'}
          color="input"
          animation={isLoading ? 'spin' : undefined}
        />
        <Typography variant="captionHl" color="grey600">
          {children}
        </Typography>
      </div>
      {!!duration && (
        <Typography variant="captionHl" color="grey500">
          {formatDuration(duration)}
        </Typography>
      )}
    </ChipWrapper>
  )
}

export const ChatMessages = {
  Sent: SentMessage,
  Received: ReceivedMessage,
  Loading: LoadingMessage,
  Error: ErrorMessage,
  Info: InfoMessage,
}
