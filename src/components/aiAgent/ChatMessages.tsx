import { Icon } from 'lago-design-system'
import { Duration } from 'luxon'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CHAT_MESSAGE_SENT_TEST_ID = 'chat-message-sent'
export const CHAT_MESSAGE_RECEIVED_TEST_ID = 'chat-message-received'
export const CHAT_MESSAGE_LOADING_TEST_ID = 'chat-message-loading'
export const CHAT_MESSAGE_LOADING_FINANCE_TEST_ID = 'chat-message-loading-finance'
export const CHAT_MESSAGE_ERROR_TEST_ID = 'chat-message-error'
export const CHAT_MESSAGE_INFO_TEST_ID = 'chat-message-info'

/**
 * Converts a number (in seconds) into a human-readable duration string
 * @param seconds - The duration in seconds
 * @returns A human-readable duration string (e.g., "2m 30s", "1h 15m", "45s")
 */

const formatDuration = (seconds: number): string => {
  const locale = 'en-US'
  const durationObject = Duration.fromObject({ minutes: 0, seconds })
    .reconfigure({ locale })
    .normalize()
    .toObject()

  return new Intl.DurationFormat(locale, { style: 'narrow' }).format(durationObject)
}

const SentMessage = ({ children }: { children: ReactNode }) => {
  return (
    <Typography
      data-id="sent-message"
      data-test={CHAT_MESSAGE_SENT_TEST_ID}
      className="max-w-[324px] self-end whitespace-normal break-words rounded-xl border border-grey-300 bg-white px-4 py-3"
      variant="captionHl"
      color="grey700"
    >
      {children}
    </Typography>
  )
}

const ReceivedMessage = ({ children }: { children: ReactNode }) => {
  return (
    <Typography
      data-id="received-message"
      data-test={CHAT_MESSAGE_RECEIVED_TEST_ID}
      className="whitespace-normal"
      color="grey700"
    >
      {children}
    </Typography>
  )
}

const LoadingMessage = ({ agentType }: { agentType: AiAgentTypeEnum }) => {
  const { translate } = useInternationalization()

  if (agentType === AiAgentTypeEnum.finance) {
    return (
      <div className="flex items-center gap-1" data-test={CHAT_MESSAGE_LOADING_FINANCE_TEST_ID}>
        <Typography variant="caption" color="grey500">
          {translate('text_1782903800979dsgmc2xp79z')}
        </Typography>
        <div className="h-5 w-3 animate-pulse rounded-sm bg-grey-600" />
      </div>
    )
  }

  return (
    <div className="flex gap-1" data-test={CHAT_MESSAGE_LOADING_TEST_ID}>
      <div className="h-5 w-3 animate-pulse rounded-sm bg-grey-600" />
    </div>
  )
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
      <div className="flex items-center gap-2" data-test={CHAT_MESSAGE_ERROR_TEST_ID}>
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
      <div className="flex items-center gap-2" data-test={CHAT_MESSAGE_INFO_TEST_ID}>
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
