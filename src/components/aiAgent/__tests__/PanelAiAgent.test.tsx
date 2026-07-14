import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_PROMPT_EDITOR_INPUT_TEST_ID,
  CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID,
} from '~/components/aiAgent/ChatPromptEditor'
import { CHAT_SHORTCUTS_TEST_ID } from '~/components/aiAgent/ChatShortcuts'
import {
  PANEL_AI_AGENT_ERROR_TEST_ID,
  PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID,
  PANEL_AI_AGENT_WELCOME_TEST_ID,
  PanelAiAgent,
} from '~/components/aiAgent/PanelAiAgent'
import { ChatState } from '~/hooks/aiAgent/aiAgentReducer'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/components/aiAgent/llmOutputs', () => ({
  Message: ({ message }: { message: { message: string } }) => <span>{message.message}</span>,
}))

jest.mock('~/components/premium/PremiumFeature', () => ({
  __esModule: true,
  default: () => <div>premium feature</div>,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockAddNewMessage = jest.fn()
const mockStartNewConversation = jest.fn()
const mockSubmitFinanceQuestion = jest.fn()
const mockCreateAiConversation = jest.fn()
const mockSubscriptionRestart = jest.fn()

let mockState: ChatState
let mockAgentType: AiAgentTypeEnum
let mockConversationId: string
let mockCreateLoading: boolean
let mockCreateError: Error | undefined

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    addNewMessage: mockAddNewMessage,
    agentType: mockAgentType,
    conversationId: mockConversationId,
    startNewConversation: mockStartNewConversation,
    setAgentType: jest.fn(),
    state: mockState,
  }),
}))

jest.mock('~/components/aiAgent/hooks/useCreateAiConversation', () => ({
  useCreateAiConversation: () => ({
    createAiConversation: mockCreateAiConversation,
    loading: mockCreateLoading,
    error: mockCreateError,
  }),
}))

jest.mock('~/components/aiAgent/hooks/useAskFinanceAssistant', () => ({
  useAskFinanceAssistant: () => ({
    submitFinanceQuestion: mockSubmitFinanceQuestion,
  }),
}))

jest.mock('~/components/aiAgent/hooks/useOnConversation', () => ({
  useOnConversation: () => ({
    restart: mockSubscriptionRestart,
    data: undefined,
    error: undefined,
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

const submitPrompt = async (message: string) => {
  await userEvent.type(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID), message)
  await userEvent.click(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID))
}

describe('PanelAiAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState = buildState()
    mockAgentType = AiAgentTypeEnum.billing
    mockConversationId = ''
    mockCreateLoading = false
    mockCreateError = undefined
  })

  describe('GIVEN the conversation is empty', () => {
    describe('WHEN the user has access to the AI agent', () => {
      it('THEN should display the welcome message with the shortcuts', () => {
        render(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CHAT_SHORTCUTS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the user has no access to the AI agent', () => {
      it('THEN should display the premium block without the shortcuts', () => {
        render(<PanelAiAgent hasAccessToAiAgent={false} />)

        expect(screen.getByTestId(PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CHAT_SHORTCUTS_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the billing agent is active', () => {
    describe('WHEN submitting a first message', () => {
      it('THEN should create a new conversation with the message', async () => {
        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        expect(mockCreateAiConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: { message: 'hello', conversationId: undefined },
            },
          }),
        )
        expect(mockSubmitFinanceQuestion).not.toHaveBeenCalled()
      })

      it('THEN should start the conversation once the mutation completes', async () => {
        mockCreateAiConversation.mockImplementation(({ onCompleted }) =>
          onCompleted({ createAiConversation: { id: 'conv-1' } }),
        )

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        await waitFor(() => {
          expect(mockStartNewConversation).toHaveBeenCalledWith({
            convId: 'conv-1',
            message: 'hello',
          })
        })
      })

      it('THEN should not start the conversation when the mutation returns no id', async () => {
        mockCreateAiConversation.mockImplementation(({ onCompleted }) =>
          onCompleted({ createAiConversation: null }),
        )

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        expect(mockStartNewConversation).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting a follow-up message in an existing conversation', () => {
      it('THEN should append the message and restart the stream subscription', async () => {
        mockConversationId = 'conv-1'
        mockState = buildState({
          messages: [
            {
              id: 'user-1',
              role: 'user' as never,
              message: 'previous question',
              status: 'done' as never,
            },
            {
              id: 'assistant-1',
              role: 'assistant' as never,
              message: 'previous answer',
              status: 'done' as never,
            },
          ],
        })
        mockCreateAiConversation.mockImplementation(({ onCompleted }) =>
          onCompleted({ createAiConversation: { id: 'conv-1' } }),
        )

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('follow up')

        expect(mockCreateAiConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: { message: 'follow up', conversationId: 'conv-1' },
            },
          }),
        )
        await waitFor(() => {
          expect(mockAddNewMessage).toHaveBeenCalledWith('follow up')
        })
        expect(mockSubscriptionRestart).toHaveBeenCalledTimes(1)
        expect(mockStartNewConversation).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the conversation creation fails', () => {
      it('THEN should display the error message', () => {
        mockCreateError = new Error('boom')

        render(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.getByTestId(PANEL_AI_AGENT_ERROR_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the finance agent is active', () => {
    describe('WHEN submitting a message', () => {
      it('THEN should route the question to the finance assistant', async () => {
        mockAgentType = AiAgentTypeEnum.finance

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('What is my MRR?')

        expect(mockSubmitFinanceQuestion).toHaveBeenCalledWith('What is my MRR?')
        expect(mockCreateAiConversation).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a late billing completion after switching to the finance agent', () => {
    describe('WHEN the mutation completes after the switch', () => {
      it('THEN should ignore the stale completion', async () => {
        let capturedOnCompleted: ((data: unknown) => void) | undefined

        mockCreateAiConversation.mockImplementation(({ onCompleted }) => {
          capturedOnCompleted = onCompleted
        })

        const { rerender } = render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        mockAgentType = AiAgentTypeEnum.finance
        rerender(<PanelAiAgent hasAccessToAiAgent />)

        capturedOnCompleted?.({ createAiConversation: { id: 'conv-1' } })

        expect(mockStartNewConversation).not.toHaveBeenCalled()
        expect(mockAddNewMessage).not.toHaveBeenCalled()
      })
    })
  })
})
