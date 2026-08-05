import { screen } from '@testing-library/react'

import { CHAT_CONVERSATION_TEST_ID, ChatConversation } from '~/components/aiAgent/ChatConversation'
import {
  CHAT_MESSAGE_ERROR_TEST_ID,
  CHAT_MESSAGE_LOADING_FINANCE_TEST_ID,
  CHAT_MESSAGE_LOADING_TEST_ID,
  CHAT_MESSAGE_RECEIVED_TEST_ID,
  CHAT_MESSAGE_SENT_TEST_ID,
} from '~/components/aiAgent/ChatMessages'
import { OnConversationSubscriptionHookResult } from '~/generated/graphql'
import { ChatMessage, ChatRole, ChatState, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/components/aiAgent/llmOutputs', () => ({
  Message: ({ message }: { message: { message: string } }) => <span>{message.message}</span>,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockStreamChunk = jest.fn()
const mockSetChatDone = jest.fn()

let mockState: ChatState
let mockAgentType: AiAgentTypeEnum

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    agentType: mockAgentType,
    state: mockState,
    lastAssistantMessage: mockState.messages
      .filter((message: ChatMessage) => message.role === 'assistant')
      .pop(),
    streamChunk: mockStreamChunk,
    setChatDone: mockSetChatDone,
  }),
}))

const buildState = (overrides: Partial<ChatState> = {}): ChatState => ({
  messages: [],
  isLoading: false,
  isStreaming: false,
  hasError: false,
  financeSessionId: undefined,
  ...overrides,
})

const idleSubscription = {
  data: undefined,
  error: undefined,
} as unknown as OnConversationSubscriptionHookResult

const conversationMessages: ChatMessage[] = [
  { id: 'user-1', role: ChatRole.user, message: 'question', status: ChatStatus.done },
  { id: 'assistant-1', role: ChatRole.assistant, message: 'answer', status: ChatStatus.done },
]

describe('ChatConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAgentType = AiAgentTypeEnum.billing
    mockState = buildState({ messages: conversationMessages })
  })

  describe('GIVEN a conversation with user and assistant messages', () => {
    describe('WHEN it renders', () => {
      it('THEN should display the sent and received messages', () => {
        render(<ChatConversation subscription={idleSubscription} />)

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CHAT_MESSAGE_SENT_TEST_ID)).toHaveTextContent('question')
        expect(screen.getByTestId(CHAT_MESSAGE_RECEIVED_TEST_ID)).toHaveTextContent('answer')
      })
    })
  })

  describe('GIVEN a pending assistant message with no content yet', () => {
    describe('WHEN it renders', () => {
      it('THEN should skip the empty assistant bubble', () => {
        mockState = buildState({
          isLoading: true,
          messages: [
            { id: 'user-1', role: ChatRole.user, message: 'question', status: ChatStatus.done },
            {
              id: 'assistant-1',
              role: ChatRole.assistant,
              message: '',
              status: ChatStatus.pending,
            },
          ],
        })

        render(<ChatConversation subscription={idleSubscription} />)

        expect(screen.queryByTestId(CHAT_MESSAGE_RECEIVED_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the conversation is loading', () => {
    describe('WHEN the billing agent is active', () => {
      it('THEN should display the billing loader', () => {
        mockState = buildState({ isLoading: true, messages: conversationMessages })

        render(<ChatConversation subscription={idleSubscription} />)

        expect(screen.getByTestId(CHAT_MESSAGE_LOADING_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the finance agent is active', () => {
      it('THEN should display the finance loader', () => {
        mockAgentType = AiAgentTypeEnum.finance
        mockState = buildState({ isLoading: true, messages: conversationMessages })

        render(<ChatConversation subscription={idleSubscription} />)

        expect(screen.getByTestId(CHAT_MESSAGE_LOADING_FINANCE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an error occurred', () => {
    describe('WHEN the subscription errors', () => {
      it('THEN should display the error message', () => {
        render(
          <ChatConversation
            subscription={
              {
                data: undefined,
                error: new Error('boom'),
              } as unknown as OnConversationSubscriptionHookResult
            }
          />,
        )

        expect(screen.getByTestId(CHAT_MESSAGE_ERROR_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the chat state carries an error', () => {
      it('THEN should display the error message', () => {
        mockState = buildState({ hasError: true, messages: conversationMessages })

        render(<ChatConversation subscription={idleSubscription} />)

        expect(screen.getByTestId(CHAT_MESSAGE_ERROR_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the subscription streams', () => {
    describe('WHEN a chunk arrives', () => {
      it('THEN should append the chunk to the last assistant message', () => {
        render(
          <ChatConversation
            subscription={
              {
                data: { aiConversationStreamed: { chunk: 'partial', done: false } },
                error: undefined,
              } as unknown as OnConversationSubscriptionHookResult
            }
          />,
        )

        expect(mockStreamChunk).toHaveBeenCalledWith({
          messageId: 'assistant-1',
          chunk: 'partial',
        })
      })
    })

    describe('WHEN the stream completes', () => {
      it('THEN should mark the last assistant message as done', () => {
        render(
          <ChatConversation
            subscription={
              {
                data: { aiConversationStreamed: { chunk: null, done: true } },
                error: undefined,
              } as unknown as OnConversationSubscriptionHookResult
            }
          />,
        )

        expect(mockSetChatDone).toHaveBeenCalledWith('assistant-1')
        expect(mockStreamChunk).not.toHaveBeenCalled()
      })
    })
  })
})
