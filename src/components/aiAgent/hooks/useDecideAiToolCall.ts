import { gql } from '@apollo/client'

import {
  CancelAiConversationToolCallMutationFn,
  ConfirmAiConversationToolCallMutationFn,
  useCancelAiConversationToolCallMutation,
  useConfirmAiConversationToolCallMutation,
} from '~/generated/graphql'

gql`
  mutation confirmAiConversationToolCall($input: ConfirmAiConversationToolCallInput!) {
    confirmAiConversationToolCall(input: $input) {
      ...AiConversationToolCallItem
    }
  }

  mutation cancelAiConversationToolCall($input: CancelAiConversationToolCallInput!) {
    cancelAiConversationToolCall(input: $input) {
      ...AiConversationToolCallItem
    }
  }
`

type UseDecideAiToolCall = {
  confirmToolCall: ConfirmAiConversationToolCallMutationFn
  cancelToolCall: CancelAiConversationToolCallMutationFn
  loading: boolean
}

export const useDecideAiToolCall = (): UseDecideAiToolCall => {
  const [confirmToolCall, { loading: confirmLoading }] = useConfirmAiConversationToolCallMutation()
  const [cancelToolCall, { loading: cancelLoading }] = useCancelAiConversationToolCallMutation()

  return {
    confirmToolCall,
    cancelToolCall,
    loading: confirmLoading || cancelLoading,
  }
}
