import { Icon } from 'lago-design-system'
import { useRef } from 'react'

import { useGetAiConversation } from '~/components/aiAgent/hooks/getAiConversation'
import { useDecideAiToolCall } from '~/components/aiAgent/hooks/useDecideAiToolCall'
import { formatToolCallArguments, humanizeToolCallName } from '~/components/aiAgent/utils'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import {
  AiConversationToolCallItemFragment,
  AiConversationToolCallStatusEnum,
} from '~/generated/graphql'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CHAT_TOOL_CALL_CONFIRMATION_TEST_ID = 'chat-tool-call-confirmation'
export const CHAT_TOOL_CALL_ITEM_TEST_ID = 'chat-tool-call-item'
export const CHAT_TOOL_CALL_NAME_TEST_ID = 'chat-tool-call-name'
export const CHAT_TOOL_CALL_ARGUMENT_TEST_ID = 'chat-tool-call-argument'
export const CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID = 'chat-tool-call-confirm-button'
export const CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID = 'chat-tool-call-cancel-button'
export const CHAT_TOOL_CALL_STATUS_TEST_ID = 'chat-tool-call-status'

type ChatToolCallConfirmationProps = {
  // Called once every write is answered, so the panel listens for the agent carrying on
  onResume: () => void
}

/**
 * The writes the agent asked for. Each one only runs once the member confirms it,
 * and the conversation carries on once every one of them is confirmed or cancelled.
 */
export const ChatToolCallConfirmation = ({ onResume }: ChatToolCallConfirmationProps) => {
  const { conversationId, state, decideToolCall, resumeConversation, setPendingToolCalls } =
    useAiAgent()
  const { confirmToolCall, cancelToolCall, loading } = useDecideAiToolCall()
  const { getAiConversation } = useGetAiConversation()
  const { translate } = useInternationalization()

  // Read after the mutation resolves, when the closure's state may be stale
  const toolCallsRef = useRef(state.toolCalls)

  toolCallsRef.current = state.toolCalls

  if (!state.toolCalls.length) {
    return null
  }

  // The server is the source of truth when an answer fails, e.g. it was given in another tab
  const syncPendingToolCalls = async () => {
    if (!conversationId) return

    const { data } = await getAiConversation({
      variables: { id: conversationId },
      fetchPolicy: 'network-only',
    })

    if (data?.aiConversation) {
      setPendingToolCalls(data.aiConversation.pendingToolCalls)
    }
  }

  const handleDecision = async (toolCall: AiConversationToolCallItemFragment, confirm: boolean) => {
    const variables = { input: { id: toolCall.id } }
    const decidedToolCall = confirm
      ? (await confirmToolCall({ variables })).data?.confirmAiConversationToolCall
      : (await cancelToolCall({ variables })).data?.cancelAiConversationToolCall

    if (!decidedToolCall) {
      return syncPendingToolCalls()
    }

    const isLastPendingToolCall = !toolCallsRef.current.some(
      (item) => item.id !== toolCall.id && item.status === AiConversationToolCallStatusEnum.Pending,
    )

    if (isLastPendingToolCall) {
      resumeConversation()

      return onResume()
    }

    decideToolCall({ toolCallId: toolCall.id, status: decidedToolCall.status })
  }

  return (
    <div className="flex flex-col gap-3" data-test={CHAT_TOOL_CALL_CONFIRMATION_TEST_ID}>
      <div className="flex items-center gap-2">
        <Icon name="warning-unfilled" color="warning" />
        <Typography variant="captionHl" color="grey700">
          {translate('text_17927142915928y0tvo3je6b')}
        </Typography>
      </div>

      {state.toolCalls.map((toolCall) => {
        const toolArguments = formatToolCallArguments(toolCall.arguments)
        const isPending = toolCall.status === AiConversationToolCallStatusEnum.Pending

        return (
          <div
            key={toolCall.id}
            className="flex flex-col gap-3 rounded-xl border border-grey-300 bg-white p-4"
            data-test={CHAT_TOOL_CALL_ITEM_TEST_ID}
          >
            <Typography variant="bodyHl" color="grey700" data-test={CHAT_TOOL_CALL_NAME_TEST_ID}>
              {humanizeToolCallName(toolCall.name)}
            </Typography>

            {!!toolArguments.length && (
              <dl className="flex flex-col gap-2">
                {toolArguments.map((argument) => (
                  <div
                    key={argument.key}
                    className="flex flex-col gap-1"
                    data-test={CHAT_TOOL_CALL_ARGUMENT_TEST_ID}
                  >
                    <Typography component="dt" variant="caption" color="grey600">
                      {argument.label}
                    </Typography>
                    <Typography
                      component="dd"
                      variant="captionCode"
                      color="grey700"
                      className="whitespace-pre-wrap break-words"
                    >
                      {argument.value}
                    </Typography>
                  </div>
                ))}
              </dl>
            )}

            {isPending ? (
              <div className="flex justify-end gap-2">
                <Button
                  size="small"
                  variant="quaternary"
                  disabled={loading}
                  onClick={() => handleDecision(toolCall, false)}
                  data-test={CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID}
                >
                  {translate('text_1792714291592qergcei21hx')}
                </Button>
                <Button
                  size="small"
                  disabled={loading}
                  onClick={() => handleDecision(toolCall, true)}
                  data-test={CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID}
                >
                  {translate('text_17927142915926iy26bnmnb7')}
                </Button>
              </div>
            ) : (
              <Typography
                variant="captionHl"
                color="grey600"
                className="self-end"
                data-test={CHAT_TOOL_CALL_STATUS_TEST_ID}
              >
                {toolCall.status === AiConversationToolCallStatusEnum.Cancelled
                  ? translate('text_17927142915924dhjygav01h')
                  : translate('text_179271429159249m3twmho35')}
              </Typography>
            )}
          </div>
        )
      })}

      <Typography variant="caption" color="grey600">
        {translate('text_1792714291592znrvz6kenr1')}
      </Typography>
    </div>
  )
}
