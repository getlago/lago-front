import { gql } from '@apollo/client'

import {
  useCancelAiConversationToolCallMutation,
  useConfirmAiConversationToolCallMutation,
} from '~/generated/graphql'

gql`
  mutation confirmAiConversationToolCall($input: ConfirmAiConversationToolCallInput!) {
    confirmAiConversationToolCall(input: $input) {
      ...AiConversationToolCallItem
      batchAnswered
    }
  }

  mutation cancelAiConversationToolCall($input: CancelAiConversationToolCallInput!) {
    cancelAiConversationToolCall(input: $input) {
      ...AiConversationToolCallItem
      batchAnswered
    }
  }
`

export const useDecideAiToolCall = () => {
  const [confirmToolCall, { loading: confirmLoading }] = useConfirmAiConversationToolCallMutation()
  const [cancelToolCall, { loading: cancelLoading }] = useCancelAiConversationToolCallMutation()

  return {
    confirmToolCall,
    cancelToolCall,
    loading: confirmLoading || cancelLoading,
  }
}
