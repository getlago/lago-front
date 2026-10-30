import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_TOOL_CALL_ARGUMENT_TEST_ID,
  CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID,
  CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID,
  CHAT_TOOL_CALL_CONFIRMATION_TEST_ID,
  CHAT_TOOL_CALL_ITEM_TEST_ID,
  CHAT_TOOL_CALL_NAME_TEST_ID,
  CHAT_TOOL_CALL_STATUS_TEST_ID,
  ChatToolCallConfirmation,
} from '~/components/aiAgent/ChatToolCallConfirmation'
import {
  AiConversationToolCallItemFragment,
  AiConversationToolCallStatusEnum,
} from '~/generated/graphql'
import { ChatState } from '~/hooks/aiAgent/aiAgentReducer'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDecideToolCall = jest.fn()
const mockResumeConversation = jest.fn()
const mockSetPendingToolCalls = jest.fn()
const mockConfirmToolCall = jest.fn()
const mockCancelToolCall = jest.fn()
const mockGetAiConversation = jest.fn()
const mockAddToast = jest.fn()

let mockState: ChatState
let mockDecideLoading: boolean

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    conversationId: 'conv-1',
    state: mockState,
    decideToolCall: mockDecideToolCall,
    resumeConversation: mockResumeConversation,
    setPendingToolCalls: mockSetPendingToolCalls,
  }),
}))

jest.mock('~/components/aiAgent/hooks/useDecideAiToolCall', () => ({
  useDecideAiToolCall: () => ({
    confirmToolCall: mockConfirmToolCall,
    cancelToolCall: mockCancelToolCall,
    loading: mockDecideLoading,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('~/components/aiAgent/hooks/getAiConversation', () => ({
  useGetAiConversation: () => ({
    getAiConversation: mockGetAiConversation,
  }),
}))

const buildToolCall = (
  overrides: Partial<AiConversationToolCallItemFragment> = {},
): AiConversationToolCallItemFragment => ({
  id: 'tool-call-1',
  name: 'void_invoice',
  arguments: { lago_id: 'invoice-1' },
  status: AiConversationToolCallStatusEnum.Pending,
  ...overrides,
})

const buildState = (toolCalls: AiConversationToolCallItemFragment[]): ChatState => ({
  messages: [],
  isLoading: false,
  isStreaming: false,
  hasError: false,
  financeSessionId: undefined,
  toolCalls,
})

const decidedResult = (
  field: string,
  status: AiConversationToolCallStatusEnum,
  id = 'tool-call-1',
) => ({
  data: { [field]: { ...buildToolCall({ id }), status } },
})

const serverPending = (pendingToolCalls: AiConversationToolCallItemFragment[]) => ({
  data: { aiConversation: { id: 'conv-1', pendingToolCalls } },
})

describe('ChatToolCallConfirmation', () => {
  const onResume = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDecideLoading = false
    mockState = buildState([buildToolCall()])
    mockGetAiConversation.mockResolvedValue(serverPending([]))
  })

  describe('GIVEN the agent asked for no write', () => {
    describe('WHEN it renders', () => {
      it('THEN should render nothing', () => {
        mockState = buildState([])

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.queryByTestId(CHAT_TOOL_CALL_CONFIRMATION_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the agent asked for a write', () => {
    describe('WHEN it renders', () => {
      it('THEN should show the action in readable words with its parameters', () => {
        mockState = buildState([
          buildToolCall({
            name: 'create_coupon',
            arguments: { coupon_code: 'WELCOME', amount_cents: 1000 },
          }),
        ])

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.getByTestId(CHAT_TOOL_CALL_NAME_TEST_ID)).toHaveTextContent('Create coupon')

        const toolArguments = screen.getAllByTestId(CHAT_TOOL_CALL_ARGUMENT_TEST_ID)

        expect(toolArguments).toHaveLength(2)
        expect(toolArguments[0]).toHaveTextContent('Coupon code')
        expect(toolArguments[0]).toHaveTextContent('WELCOME')
        expect(toolArguments[1]).toHaveTextContent('Amount cents')
        expect(toolArguments[1]).toHaveTextContent('1000')
        expect(screen.getByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID)).toBeEnabled()
        expect(screen.getByTestId(CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID)).toBeEnabled()
      })
    })

    describe('WHEN a parameter holds nested values', () => {
      it('THEN should show them as a JSON code snippet', () => {
        mockState = buildState([buildToolCall({ arguments: { coupon: { code: 'WELCOME' } } })])

        render(<ChatToolCallConfirmation onResume={onResume} />)

        const argument = screen.getByTestId(CHAT_TOOL_CALL_ARGUMENT_TEST_ID)

        expect(argument.querySelector('code.language-json')).toBeInTheDocument()
        expect(argument).toHaveTextContent('"code": "WELCOME"')
      })
    })

    describe('WHEN an answer is in flight', () => {
      it('THEN should disable the buttons', () => {
        mockDecideLoading = true

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.getByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the member confirms the only write', () => {
      it('THEN should confirm it and resume the conversation', async () => {
        mockConfirmToolCall.mockResolvedValue(
          decidedResult(
            'confirmAiConversationToolCall',
            AiConversationToolCallStatusEnum.Confirmed,
          ),
        )

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onResume).toHaveBeenCalledTimes(1)
        })
        expect(mockConfirmToolCall).toHaveBeenCalledWith({
          variables: { input: { id: 'tool-call-1' } },
        })
        expect(mockCancelToolCall).not.toHaveBeenCalled()
        expect(mockResumeConversation).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the member cancels the only write', () => {
      it('THEN should cancel it and resume the conversation', async () => {
        mockCancelToolCall.mockResolvedValue(
          decidedResult('cancelAiConversationToolCall', AiConversationToolCallStatusEnum.Cancelled),
        )

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getByTestId(CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onResume).toHaveBeenCalledTimes(1)
        })
        expect(mockCancelToolCall).toHaveBeenCalledWith({
          variables: { input: { id: 'tool-call-1' } },
        })
        expect(mockConfirmToolCall).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the answer fails while the write still waits on the server', () => {
      it('THEN should tell the member and keep the write waiting', async () => {
        mockConfirmToolCall.mockResolvedValue({ data: null, errors: [new Error('boom')] })
        mockGetAiConversation.mockResolvedValue(serverPending([buildToolCall()]))

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockSetPendingToolCalls).toHaveBeenCalledWith([buildToolCall()])
        })
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: 'text_1793366573261luhavy8p9zm',
        })
        expect(mockGetAiConversation).toHaveBeenCalledWith({
          variables: { id: 'conv-1' },
          fetchPolicy: 'network-only',
        })
        expect(onResume).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the answer does not reach the server but nothing waits anymore', () => {
      it('THEN should follow the agent carrying on', async () => {
        mockConfirmToolCall.mockRejectedValue(new Error('Network error'))

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onResume).toHaveBeenCalledTimes(1)
        })
        expect(mockAddToast).toHaveBeenCalledTimes(1)
        expect(mockResumeConversation).toHaveBeenCalledTimes(1)
      })
    })

    describe.each([
      [AiConversationToolCallStatusEnum.Confirmed, 'text_179271429159249m3twmho35'],
      [AiConversationToolCallStatusEnum.Executing, 'text_1793366573261bsyp1vy7eft'],
      [AiConversationToolCallStatusEnum.Completed, 'text_179336657326199iv6imrf7f'],
      [AiConversationToolCallStatusEnum.Cancelled, 'text_17927142915924dhjygav01h'],
    ])('WHEN the write is %s', (status, translationKey) => {
      it('THEN should show its own label', () => {
        mockState = buildState([buildToolCall({ status })])

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.getByTestId(CHAT_TOOL_CALL_STATUS_TEST_ID)).toHaveTextContent(translationKey)
      })
    })
  })

  describe('GIVEN the agent asked for several writes', () => {
    describe('WHEN the member answers one while another still waits', () => {
      it('THEN should record the answer without resuming', async () => {
        const otherToolCall = buildToolCall({ id: 'tool-call-2' })

        mockState = buildState([buildToolCall(), otherToolCall])
        mockConfirmToolCall.mockResolvedValue(
          decidedResult(
            'confirmAiConversationToolCall',
            AiConversationToolCallStatusEnum.Confirmed,
          ),
        )
        mockGetAiConversation.mockResolvedValue(serverPending([otherToolCall]))

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.getAllByTestId(CHAT_TOOL_CALL_ITEM_TEST_ID)).toHaveLength(2)

        await userEvent.click(screen.getAllByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID)[0])

        await waitFor(() => {
          expect(mockSetPendingToolCalls).toHaveBeenCalledWith([
            buildToolCall({ status: AiConversationToolCallStatusEnum.Confirmed }),
            otherToolCall,
          ])
        })
        expect(mockDecideToolCall).toHaveBeenCalledWith({
          toolCallId: 'tool-call-1',
          status: AiConversationToolCallStatusEnum.Confirmed,
        })
        expect(mockResumeConversation).not.toHaveBeenCalled()
        expect(onResume).not.toHaveBeenCalled()
      })
    })

    describe('WHEN another tab already answered the other write', () => {
      it('THEN should resume as the server has nothing left waiting', async () => {
        mockState = buildState([buildToolCall(), buildToolCall({ id: 'tool-call-2' })])
        mockConfirmToolCall.mockResolvedValue(
          decidedResult(
            'confirmAiConversationToolCall',
            AiConversationToolCallStatusEnum.Confirmed,
          ),
        )

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getAllByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID)[0])

        await waitFor(() => {
          expect(onResume).toHaveBeenCalledTimes(1)
        })
        expect(mockResumeConversation).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN one write is already answered', () => {
      it('THEN should show its answer instead of the buttons', () => {
        mockState = buildState([
          buildToolCall({ status: AiConversationToolCallStatusEnum.Cancelled }),
          buildToolCall({ id: 'tool-call-2' }),
        ])

        render(<ChatToolCallConfirmation onResume={onResume} />)

        expect(screen.getByTestId(CHAT_TOOL_CALL_STATUS_TEST_ID)).toHaveTextContent(
          'text_17927142915924dhjygav01h',
        )
        expect(screen.getAllByTestId(CHAT_TOOL_CALL_CONFIRM_BUTTON_TEST_ID)).toHaveLength(1)
      })
    })

    describe('WHEN the member answers the last waiting write', () => {
      it('THEN should resume the conversation', async () => {
        mockState = buildState([
          buildToolCall({ status: AiConversationToolCallStatusEnum.Confirmed }),
          buildToolCall({ id: 'tool-call-2' }),
        ])
        mockCancelToolCall.mockResolvedValue(
          decidedResult('cancelAiConversationToolCall', AiConversationToolCallStatusEnum.Cancelled),
        )

        render(<ChatToolCallConfirmation onResume={onResume} />)

        await userEvent.click(screen.getByTestId(CHAT_TOOL_CALL_CANCEL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(onResume).toHaveBeenCalledTimes(1)
        })
        expect(mockCancelToolCall).toHaveBeenCalledWith({
          variables: { input: { id: 'tool-call-2' } },
        })
        expect(mockResumeConversation).toHaveBeenCalledTimes(1)
      })
    })
  })
})
