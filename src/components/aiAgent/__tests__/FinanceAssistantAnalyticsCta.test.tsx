import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  FINANCE_ASSISTANT_CTA_INPUT_TEST_ID,
  FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID,
  FINANCE_ASSISTANT_CTA_TEST_ID,
  FinanceAssistantAnalyticsCta,
} from '~/components/aiAgent/FinanceAssistantAnalyticsCta'
import { ChatState } from '~/hooks/aiAgent/aiAgentReducer'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockOpenPanelWithAgent = jest.fn()
const mockSubmitFinanceQuestion = jest.fn()

let mockState: ChatState
let mockIsPremium: boolean
let mockHasPermissions: boolean

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    openPanelWithAgent: mockOpenPanelWithAgent,
    state: mockState,
  }),
}))

jest.mock('~/components/aiAgent/hooks/useAskFinanceAssistant', () => ({
  useAskFinanceAssistant: () => ({
    submitFinanceQuestion: mockSubmitFinanceQuestion,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: mockIsPremium,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => mockHasPermissions,
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

describe('FinanceAssistantAnalyticsCta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState = buildState()
    mockIsPremium = true
    mockHasPermissions = true
  })

  describe('GIVEN the user has no access to the AI agent', () => {
    describe('WHEN the user is not premium', () => {
      it('THEN should render nothing', () => {
        mockIsPremium = false

        render(<FinanceAssistantAnalyticsCta />)

        expect(screen.queryByTestId(FINANCE_ASSISTANT_CTA_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user lacks the AI conversation permissions', () => {
      it('THEN should render nothing', () => {
        mockHasPermissions = false

        render(<FinanceAssistantAnalyticsCta />)

        expect(screen.queryByTestId(FINANCE_ASSISTANT_CTA_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user has access to the AI agent', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the CTA with a disabled submit button', () => {
        render(<FinanceAssistantAnalyticsCta />)

        expect(screen.getByTestId(FINANCE_ASSISTANT_CTA_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN typing a question', () => {
      it('THEN should enable the submit button', async () => {
        render(<FinanceAssistantAnalyticsCta />)

        await userEvent.type(
          screen.getByTestId(FINANCE_ASSISTANT_CTA_INPUT_TEST_ID),
          'What is my MRR?',
        )

        expect(screen.getByTestId(FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID)).not.toBeDisabled()
      })

      it('THEN should keep the submit button disabled for whitespace-only input', async () => {
        render(<FinanceAssistantAnalyticsCta />)

        await userEvent.type(screen.getByTestId(FINANCE_ASSISTANT_CTA_INPUT_TEST_ID), '   ')

        expect(screen.getByTestId(FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN submitting a question', () => {
      it('THEN should open the finance assistant panel with the trimmed question and hide the CTA', async () => {
        render(<FinanceAssistantAnalyticsCta />)

        await userEvent.type(
          screen.getByTestId(FINANCE_ASSISTANT_CTA_INPUT_TEST_ID),
          '  What is my MRR?  ',
        )
        await userEvent.click(screen.getByTestId(FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID))

        expect(mockOpenPanelWithAgent).toHaveBeenCalledWith(AiAgentTypeEnum.finance)
        expect(mockSubmitFinanceQuestion).toHaveBeenCalledWith('What is my MRR?')
        expect(screen.queryByTestId(FINANCE_ASSISTANT_CTA_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN a response is already being generated', () => {
      it('THEN should keep the submit button disabled', async () => {
        mockState = buildState({ isLoading: true })

        render(<FinanceAssistantAnalyticsCta />)

        await userEvent.type(
          screen.getByTestId(FINANCE_ASSISTANT_CTA_INPUT_TEST_ID),
          'What is my MRR?',
        )

        expect(screen.getByTestId(FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })
  })
})
