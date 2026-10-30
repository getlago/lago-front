import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'

import { useGetAiConversation } from '~/components/aiAgent/hooks/getAiConversation'
import { useDecideAiToolCall } from '~/components/aiAgent/hooks/useDecideAiToolCall'
import { formatToolCallArguments, humanizeToolCallName } from '~/components/aiAgent/utils'
import { CodeSnippet } from '~/components/CodeSnippet'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { addToast } from '~/core/apolloClient'
import {
  AiConversationToolCallItemFragment,
  AiConversationToolCallStatusEnum,
} from '~/generated/graphql'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment AiConversationToolCallItem on AiConversationToolCall {
    id
    name
    arguments
    status
  }
`

export const CHAT_TOOL_CALL_CONFIRMATION_TEST_ID = 'chat-tool-call-confirmation'
export const CHAT_TOOL_CALL_ITEM_TEST_ID = 'chat-tool-call-item'
export const CHAT_TOOL_CALL_NAME_TEST_ID = 'chat-tool-call-name'
export const CHAT_TOOL_CALL_ARGUMENT_TEST_ID = 'chat-tool-call-argument'
export const CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID = 'chat-tool-call-confirm-button'
export const CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID = 'chat-tool-call-cancel-button'
export const CHAT_TOOL_CALL_STATUS_TEST_ID = 'chat-tool-call-status'

const getStatusTranslationKey = (status: AiConversationToolCallStatusEnum): string => {
  switch (status) {
    case AiConversationToolCallStatusEnum.Pending:
    case AiConversationToolCallStatusEnum.Confirmed:
      return 'text_179271429159249m3twmho35'
    case AiConversationToolCallStatusEnum.Executing:
      return 'text_1793366573261bsyp1vy7eft'
    case AiConversationToolCallStatusEnum.Completed:
      return 'text_179336657326199iv6imrf7f'
    case AiConversationToolCallStatusEnum.Cancelled:
      return 'text_17927142915924dhjygav01h'
    default: {
      const unknownStatus: never = status

      return unknownStatus
    }
  }
}

type ChatToolCallConfirmationProps = {
  onResume: () => void
}

export const ChatToolCallConfirmation = ({ onResume }: ChatToolCallConfirmationProps) => {
  const { conversationId, state, decideToolCall, resumeConversation, setPendingToolCalls } =
    useAiAgent()
  const { confirmToolCall, cancelToolCall, loading } = useDecideAiToolCall()
  const { getAiConversation } = useGetAiConversation()
  const { translate } = useInternationalization()

  if (!state.toolCalls.length) {
    return null
  }

  const fetchPendingToolCalls = async (): Promise<
    AiConversationToolCallItemFragment[] | undefined
  > => {
    if (!conversationId) return undefined

    const { data } = await getAiConversation({
      variables: { id: conversationId },
      fetchPolicy: 'network-only',
    })

    return data?.aiConversation?.pendingToolCalls
  }

  // Keeps the answers given here, and drops writes another tab answered meanwhile
  const syncToolCalls = (
    pendingToolCalls: AiConversationToolCallItemFragment[],
    decidedToolCall?: AiConversationToolCallItemFragment,
  ): void => {
    const pendingIds = new Set(pendingToolCalls.map((toolCall) => toolCall.id))
    const answered = state.toolCalls
      .map((toolCall) => (toolCall.id === decidedToolCall?.id ? decidedToolCall : toolCall))
      .filter(
        (toolCall) =>
          toolCall.status !== AiConversationToolCallStatusEnum.Pending &&
          !pendingIds.has(toolCall.id),
      )

    setPendingToolCalls([...answered, ...pendingToolCalls])
  }

  const handleDecision = async (
    toolCall: AiConversationToolCallItemFragment,
    confirm: boolean,
  ): Promise<void> => {
    const variables = { input: { id: toolCall.id } }
    const decidedToolCall = await (
      confirm
        ? confirmToolCall({ variables }).then(({ data }) => data?.confirmAiConversationToolCall)
        : cancelToolCall({ variables }).then(({ data }) => data?.cancelAiConversationToolCall)
    ).catch(() => undefined)

    if (decidedToolCall) {
      decideToolCall({ toolCallId: toolCall.id, status: decidedToolCall.status })
    } else {
      addToast({ severity: 'danger', translateKey: 'text_1793366573261luhavy8p9zm' })
    }

    // Only the server knows whether the agent carries on: another tab may have answered the rest
    const pendingToolCalls = await fetchPendingToolCalls()

    if (!pendingToolCalls) return

    if (!pendingToolCalls.length) {
      resumeConversation()

      return onResume()
    }

    syncToolCalls(pendingToolCalls, decidedToolCall ?? undefined)
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
                    {argument.isJson ? (
                      <dd>
                        <CodeSnippet
                          variant="minimal"
                          language="json"
                          code={argument.value}
                          displayHead={false}
                          canCopy
                        />
                      </dd>
                    ) : (
                      <Typography
                        component="dd"
                        variant="captionCode"
                        color="grey700"
                        className="whitespace-pre-wrap break-words"
                      >
                        {argument.value}
                      </Typography>
                    )}
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
                {translate(getStatusTranslationKey(toolCall.status))}
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
