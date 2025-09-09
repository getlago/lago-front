import { gql } from '@apollo/client'
import { Skeleton, Typography } from 'lago-design-system'
import { DateTime } from 'luxon'

import { useGetAiConversationLazyQuery, useListAiConversationsQuery } from '~/generated/graphql'
import { ChatRole } from '~/hooks/aiAgent/aiAgentReducer'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getAiConversation($id: ID!) {
    aiConversation(id: $id) {
      id
      messages {
        content
        type
      }
      name
    }
  }

  query listAiConversations($limit: Int) {
    aiConversations(limit: $limit) {
      collection {
        id
        name
        updatedAt
      }
    }
  }
`

export const ChatHistory = () => {
  const { setPreviousChatMessages } = useAiAgent()
  const { translate } = useInternationalization()

  const [getAiConversation] = useGetAiConversationLazyQuery()
  const { data, loading, error } = useListAiConversationsQuery({
    variables: {
      limit: 3,
    },
  })

  const handleGetAiConversation = async (id: string) => {
    const { data: singleConversationData } = await getAiConversation({
      variables: {
        id,
      },
    })

    if (singleConversationData?.aiConversation?.id) {
      const formattedMessages = singleConversationData?.aiConversation?.messages?.map(
        (message) => ({
          id: crypto.randomUUID(),
          role: message.type === 'message.input' ? ChatRole.user : ChatRole.assistant,
          message: message.content,
        }),
      )

      setPreviousChatMessages({
        convId: singleConversationData?.aiConversation.id,
        messages: formattedMessages ?? [],
      })
    }
  }

  if (error) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 p-4 pt-0">
      <Typography variant="captionHl" color="grey700">
        {translate('text_17574172258513wv8yozezoz')}
      </Typography>

      <div className="flex flex-col gap-1">
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <Skeleton variant="text" className="w-60" />
              <Skeleton variant="text" className="w-24" />
            </div>
          ))}

        {!loading &&
          data?.aiConversations?.collection.map((conversation) => (
            <div key={conversation.id} className="flex items-center justify-between gap-2">
              <button onClick={() => handleGetAiConversation(conversation.id)}>
                <Typography variant="caption" color="grey600">
                  {conversation.name}
                </Typography>
              </button>

              <Typography
                variant="caption"
                color="grey600"
                className="inline-block h-7 rounded-lg border border-grey-400 px-2"
              >
                {DateTime.fromISO(conversation.updatedAt).toRelative({
                  locale: 'en-US',
                  style: 'narrow',
                })}
              </Typography>
            </div>
          ))}
      </div>
    </div>
  )
}
