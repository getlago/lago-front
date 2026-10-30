import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_PROMPT_EDITOR_INPUT_TEST_ID,
  CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID,
} from '~/components/aiAgent/ChatPromptEditor'
import { CHAT_SHORTCUTS_TEST_ID } from '~/components/aiAgent/ChatShortcuts'
import { CHAT_TOOL_CALL_CONFIRMATION_TEST_ID } from '~/components/aiAgent/ChatToolCallConfirmation'
import {
  PANEL_AI_AGENT_ERROR_TEST_ID,
  PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID,
  PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID,
  PANEL_AI_AGENT_WELCOME_TEST_ID,
  PanelAiAgent,
} from '~/components/aiAgent/PanelAiAgent'
import { AiConversationToolCallStatusEnum, LagoApiError } from '~/generated/graphql'
import { ChatRole, ChatState, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
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
const mockAddToast = jest.fn()

let mockState: ChatState
let mockAgentType: AiAgentTypeEnum
let mockConversationId: string
let mockConversationVersion: number
let mockCreateLoading: boolean
let mockCreateError: Error | undefined

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    addNewMessage: mockAddNewMessage,
    agentType: mockAgentType,
    conversationId: mockConversationId,
    getConversationVersion: () => mockConversationVersion,
    startNewConversation: mockStartNewConversation,
    setAgentType: jest.fn(),
    setPendingToolCalls: jest.fn(),
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
  toolCalls: [],
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
    mockConversationVersion = 0
    mockCreateLoading = false
    mockCreateError = undefined
    mockCreateAiConversation.mockResolvedValue({})
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
        mockCreateAiConversation.mockImplementation(async ({ onCompleted }) => {
          onCompleted({ createAiConversation: { id: 'conv-1' } })

          return {}
        })

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
        mockCreateAiConversation.mockImplementation(async ({ onCompleted }) => {
          onCompleted({ createAiConversation: null })

          return {}
        })

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
        mockCreateAiConversation.mockImplementation(async ({ onCompleted }) => {
          onCompleted({ createAiConversation: { id: 'conv-1' } })

          return {}
        })

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

    describe('WHEN the message is refused because writes still wait for an answer', () => {
      it('THEN should ask the member to answer them instead of showing a generic error', async () => {
        mockConversationId = 'conv-1'
        mockState = buildState({
          messages: [
            { id: 'user-1', role: 'user' as never, message: 'previous', status: 'done' as never },
          ],
        })
        mockCreateAiConversation.mockImplementation(async ({ onCompleted }) => {
          onCompleted({ createAiConversation: null })

          return {
            data: { createAiConversation: null },
            errors: [
              {
                message: 'Method Not Allowed',
                extensions: { code: 'ai_conversation_tool_calls_pending' },
              },
            ],
          }
        })

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('follow up')

        await waitFor(() => {
          expect(mockAddToast).toHaveBeenCalledWith({
            severity: 'info',
            translateKey: 'text_1792714291592znrvz6kenr1',
          })
        })
        expect(mockAddNewMessage).not.toHaveBeenCalled()
        expect(mockSubscriptionRestart).not.toHaveBeenCalled()
        expect(mockCreateAiConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            context: { silentErrorCodes: [LagoApiError.AiConversationToolCallsPending] },
          }),
        )
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

        mockCreateAiConversation.mockImplementation(async ({ onCompleted }) => {
          capturedOnCompleted = onCompleted

          return {}
        })

        const { rerender } = render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        mockAgentType = AiAgentTypeEnum.finance
        mockConversationVersion += 1
        rerender(<PanelAiAgent hasAccessToAiAgent />)

        capturedOnCompleted?.({ createAiConversation: { id: 'conv-1' } })

        expect(mockStartNewConversation).not.toHaveBeenCalled()
        expect(mockAddNewMessage).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the conversation creation is in flight', () => {
    describe('WHEN the message has been submitted', () => {
      it('THEN should echo the pending prompt with the loading indicator', async () => {
        const { rerender } = render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')
        mockCreateLoading = true
        rerender(<PanelAiAgent hasAccessToAiAgent />)

        const pendingBlock = await screen.findByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)

        expect(pendingBlock).toHaveTextContent('hello')
        expect(screen.queryByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should hand the pending prompt over to the error block on failure', async () => {
        const { rerender } = render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')
        mockCreateLoading = true
        rerender(<PanelAiAgent hasAccessToAiAgent />)

        expect(await screen.findByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).toBeInTheDocument()

        mockCreateError = new Error('boom')
        rerender(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.queryByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_ERROR_TEST_ID)).toHaveTextContent('hello')
      })
    })
  })

  describe('GIVEN the agent waits for the member to confirm a write', () => {
    const conversationMessages = [
      { id: 'user-1', role: ChatRole.user, message: 'void it', status: ChatStatus.done },
      { id: 'assistant-1', role: ChatRole.assistant, message: '', status: ChatStatus.done },
    ]

    const buildToolCall = (status: AiConversationToolCallStatusEnum) => ({
      id: 'tool-call-1',
      name: 'void_invoice',
      arguments: { lago_id: 'invoice-1' },
      status,
    })

    describe('WHEN the write is still pending', () => {
      it('THEN should show the confirmation and disable the message input', () => {
        mockConversationId = 'conv-1'
        mockState = buildState({
          messages: conversationMessages,
          toolCalls: [buildToolCall(AiConversationToolCallStatusEnum.Pending)],
        })

        render(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.getByTestId(CHAT_TOOL_CALL_CONFIRMATION_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN every write is answered', () => {
      it('THEN should enable the message input again', () => {
        mockConversationId = 'conv-1'
        mockState = buildState({
          messages: conversationMessages,
          toolCalls: [buildToolCall(AiConversationToolCallStatusEnum.Confirmed)],
        })

        render(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID)).toBeEnabled()
      })
    })
  })

  describe('GIVEN a billing request still in flight', () => {
    it('THEN should disable the editor and hide shortcuts while the mutation is loading', () => {
      mockCreateLoading = true
      render(<PanelAiAgent hasAccessToAiAgent />)
      expect(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      expect(screen.queryByTestId(CHAT_SHORTCUTS_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN should ignore repeated editor and shortcut submissions until the request settles', async () => {
      let finishCreation: () => void = () => undefined

      mockCreateAiConversation.mockImplementation(
        ({ onCompleted }) =>
          new Promise<object>((resolve) => {
            finishCreation = () => {
              onCompleted({ createAiConversation: { id: 'conv-1' } })
              resolve({})
            }
          }),
      )

      render(<PanelAiAgent hasAccessToAiAgent />)
      await submitPrompt('first prompt')
      await submitPrompt('second prompt')
      await userEvent.click(
        within(screen.getByTestId(CHAT_SHORTCUTS_TEST_ID)).getAllByRole('button')[0],
      )

      expect(mockCreateAiConversation).toHaveBeenCalledTimes(1)
      await act(async () => finishCreation())
      expect(mockStartNewConversation).toHaveBeenCalledTimes(1)
      expect(mockStartNewConversation).toHaveBeenCalledWith({
        convId: 'conv-1',
        message: 'first prompt',
      })

      await submitPrompt('next prompt')
      expect(mockCreateAiConversation).toHaveBeenCalledTimes(2)
      await act(async () => finishCreation())
    })
  })
})
