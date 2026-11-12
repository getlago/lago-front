import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CHAT_CONVERSATION_TEST_ID } from '~/components/aiAgent/ChatConversation'
import {
  CHAT_PROMPT_EDITOR_INPUT_TEST_ID,
  CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID,
} from '~/components/aiAgent/ChatPromptEditor'
import { CHAT_SHORTCUTS_TEST_ID } from '~/components/aiAgent/ChatShortcuts'
import {
  PANEL_AI_AGENT_PREMIUM_BLOCK_TEST_ID,
  PANEL_AI_AGENT_WELCOME_TEST_ID,
  PanelAiAgent,
} from '~/components/aiAgent/PanelAiAgent'
import { ChatRole, ChatState, ChatStatus, createChatSession } from '~/hooks/aiAgent/aiAgentReducer'
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
const mockConfirmExchange = jest.fn()
const mockFailExchange = jest.fn()
const mockSubmitFinanceQuestion = jest.fn()
const mockCreateAiConversation = jest.fn()
const mockSubscriptionRestart = jest.fn()

let mockState: ChatState
let mockAgentType: AiAgentTypeEnum
let mockConversationId: string
let mockCreateLoading: boolean

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    addNewMessage: mockAddNewMessage,
    agentType: mockAgentType,
    confirmExchange: mockConfirmExchange,
    conversationId: mockConversationId,
    failExchange: mockFailExchange,
    setAgentType: jest.fn(),
    setChatDone: jest.fn(),
    streamChunk: jest.fn(),
    state: mockState,
    lastAssistantMessage: mockState?.messages
      .filter((message) => message.role === 'assistant')
      .pop(),
  }),
}))

jest.mock('~/components/aiAgent/hooks/useCreateAiConversation', () => ({
  useCreateAiConversation: () => ({
    createAiConversation: mockCreateAiConversation,
    loading: mockCreateLoading,
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

const SCOPE_KEY = 'user-1:org-1'

const buildState = (overrides: Partial<ChatState> = {}): ChatState => ({
  ...createChatSession(SCOPE_KEY),
  ...overrides,
})

const answeredExchange: ChatState['messages'] = [
  { id: 'user-1', role: ChatRole.user, message: 'previous question', status: ChatStatus.done },
  {
    id: 'assistant-1',
    role: ChatRole.assistant,
    message: 'previous answer',
    status: ChatStatus.done,
  },
]

const submitPrompt = async (message: string) => {
  await userEvent.type(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID), message)
  await userEvent.click(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID))
}

const submittedExchangeId = (): string => mockAddNewMessage.mock.calls[0][1]

describe('PanelAiAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState = buildState()
    mockAgentType = AiAgentTypeEnum.billing
    mockConversationId = ''
    mockCreateLoading = false
    mockCreateAiConversation.mockResolvedValue({ data: { createAiConversation: { id: 'conv-1' } } })
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
      it('THEN should add the pending exchange before the mutation resolves', async () => {
        let resolveCreation: () => void = () => undefined

        mockCreateAiConversation.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveCreation = () => resolve({ data: { createAiConversation: { id: 'conv-1' } } })
            }),
        )

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        expect(mockAddNewMessage).toHaveBeenCalledWith('hello', expect.any(String))
        expect(mockConfirmExchange).not.toHaveBeenCalled()

        await act(async () => resolveCreation())
      })

      it('THEN should create a new conversation with the message', async () => {
        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        expect(mockCreateAiConversation).toHaveBeenCalledWith({
          variables: {
            input: { message: 'hello', conversationId: undefined },
          },
        })
        expect(mockSubmitFinanceQuestion).not.toHaveBeenCalled()
      })

      it('THEN should confirm the pending exchange with the accepted conversation', async () => {
        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        await waitFor(() => {
          expect(mockConfirmExchange).toHaveBeenCalledWith({
            exchangeId: submittedExchangeId(),
            conversationId: 'conv-1',
          })
        })
        expect(mockSubscriptionRestart).not.toHaveBeenCalled()
      })

      it('THEN should fail the exchange when the mutation returns no id', async () => {
        mockCreateAiConversation.mockResolvedValue({ data: { createAiConversation: null } })

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        await waitFor(() => {
          expect(mockFailExchange).toHaveBeenCalledWith(submittedExchangeId())
        })
        expect(mockConfirmExchange).not.toHaveBeenCalled()
      })

      it('THEN should fail the exchange when the mutation throws', async () => {
        mockCreateAiConversation.mockRejectedValue(new Error('boom'))

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('hello')

        await waitFor(() => {
          expect(mockFailExchange).toHaveBeenCalledWith(submittedExchangeId())
        })
      })
    })

    describe('WHEN submitting a follow-up message in an existing conversation', () => {
      it('THEN should confirm the exchange and restart the stream subscription', async () => {
        mockConversationId = 'conv-1'
        mockState = buildState({ conversationId: 'conv-1', messages: answeredExchange })

        render(<PanelAiAgent hasAccessToAiAgent />)

        await submitPrompt('follow up')

        expect(mockCreateAiConversation).toHaveBeenCalledWith({
          variables: {
            input: { message: 'follow up', conversationId: 'conv-1' },
          },
        })
        await waitFor(() => {
          expect(mockConfirmExchange).toHaveBeenCalledWith({
            exchangeId: submittedExchangeId(),
            conversationId: 'conv-1',
          })
        })
        expect(mockSubscriptionRestart).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN an exchange is pending', () => {
      it('THEN should render the conversation instead of the welcome message', () => {
        mockState = buildState({
          messages: [
            { id: 'user-1', role: ChatRole.user, message: 'hello', status: ChatStatus.done },
            {
              id: 'exchange-1',
              role: ChatRole.assistant,
              message: '',
              status: ChatStatus.pending,
            },
          ],
          isLoading: true,
        })

        render(<PanelAiAgent hasAccessToAiAgent />)

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toHaveTextContent('hello')
        expect(screen.queryByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the exchange failed', () => {
      it('THEN should keep the sent message and display the error', () => {
        mockState = buildState({
          messages: [
            { id: 'user-1', role: ChatRole.user, message: 'hello', status: ChatStatus.done },
          ],
          hasError: true,
        })

        render(<PanelAiAgent hasAccessToAiAgent />)

        const conversation = screen.getByTestId(CHAT_CONVERSATION_TEST_ID)

        expect(conversation).toHaveTextContent('hello')
        expect(conversation).toHaveTextContent('text_1757417225851jw88w0yfa0n')
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
        expect(mockAddNewMessage).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a billing request still in flight', () => {
    it('THEN should disable the editor and hide the shortcuts', () => {
      mockCreateLoading = true
      mockState = buildState({
        messages: [
          { id: 'user-1', role: ChatRole.user, message: 'hello', status: ChatStatus.done },
          { id: 'exchange-1', role: ChatRole.assistant, message: '', status: ChatStatus.pending },
        ],
        isLoading: true,
      })

      render(<PanelAiAgent hasAccessToAiAgent />)

      expect(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      expect(screen.queryByTestId(CHAT_SHORTCUTS_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN should ignore repeated editor and shortcut submissions until the request settles', async () => {
      let finishCreation: () => void = () => undefined

      mockCreateAiConversation.mockImplementation(
        () =>
          new Promise((resolve) => {
            finishCreation = () => resolve({ data: { createAiConversation: { id: 'conv-1' } } })
          }),
      )

      render(<PanelAiAgent hasAccessToAiAgent />)
      await submitPrompt('first prompt')
      await submitPrompt('second prompt')
      await userEvent.click(
        within(screen.getByTestId(CHAT_SHORTCUTS_TEST_ID)).getAllByRole('button')[0],
      )

      expect(mockCreateAiConversation).toHaveBeenCalledTimes(1)
      expect(mockAddNewMessage).toHaveBeenCalledTimes(1)
      expect(mockAddNewMessage).toHaveBeenCalledWith('first prompt', expect.any(String))

      await act(async () => finishCreation())
      expect(mockConfirmExchange).toHaveBeenCalledTimes(1)

      await submitPrompt('next prompt')
      expect(mockCreateAiConversation).toHaveBeenCalledTimes(2)
      await act(async () => finishCreation())
    })

    it('THEN should give each back-to-back exchange its own id', async () => {
      render(<PanelAiAgent hasAccessToAiAgent />)

      await submitPrompt('first prompt')
      await submitPrompt('second prompt')

      await waitFor(() => {
        expect(mockAddNewMessage).toHaveBeenCalledTimes(2)
      })

      const [[, firstExchangeId], [, secondExchangeId]] = mockAddNewMessage.mock.calls

      expect(firstExchangeId).not.toBe(secondExchangeId)
      expect(mockConfirmExchange).toHaveBeenCalledWith({
        exchangeId: firstExchangeId,
        conversationId: 'conv-1',
      })
      expect(mockConfirmExchange).toHaveBeenCalledWith({
        exchangeId: secondExchangeId,
        conversationId: 'conv-1',
      })
    })
  })
})
