import { Button, Icon, Typography } from 'lago-design-system'
import { Duration } from 'luxon'
import { ReactNode } from 'react'

/**
 * Converts a number (in seconds) into a human-readable duration string
 * @param seconds - The duration in seconds
 * @returns A human-readable duration string (e.g., "2m 30s", "1h 15m", "45s")
 */

export const formatDuration = (seconds: number): string => {
  const locale = 'en-US'
  const durationObject = Duration.fromObject({ minutes: 0, seconds })
    .reconfigure({ locale })
    .normalize()
    .toObject()

  // @ts-expect-error Intl.DurationFormat is not typed
  // https://github.com/microsoft/TypeScript/issues/60608
  return new Intl.DurationFormat(locale, { style: 'narrow' }).format(durationObject)
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

const ErrorMessage = ({
  children,
  onAction,
  actionLabel,
}: {
  children: ReactNode
  onAction?: () => void
  actionLabel?: string
}) => {
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
          {actionLabel}
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
