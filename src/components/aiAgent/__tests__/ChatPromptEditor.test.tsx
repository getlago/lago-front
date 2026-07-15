import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_PROMPT_EDITOR_AGENT_SELECTOR_TEST_ID,
  CHAT_PROMPT_EDITOR_GRADIENT_TEST_ID,
  CHAT_PROMPT_EDITOR_INPUT_TEST_ID,
  CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID,
  ChatPromptEditor,
  GRADIENT_MIN_TEXTAREA_HEIGHT,
} from '~/components/aiAgent/ChatPromptEditor'
import { FeatureFlags, setFeatureFlags } from '~/core/utils/featureFlags'
import { ChatState } from '~/hooks/aiAgent/aiAgentReducer'
import { AGENT_TYPE_LABELS, AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockSetAgentType = jest.fn()

let mockState: ChatState
let mockAgentType: AiAgentTypeEnum

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    agentType: mockAgentType,
    setAgentType: mockSetAgentType,
    state: mockState,
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

const getInput = () => screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID) as HTMLTextAreaElement
const getSubmitButton = () =>
  screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID) as HTMLButtonElement

// jest-setup's global ResizeObserver stub never fires; keep per-instance callbacks and
// observed targets so tests can simulate a textarea resize on demand.
let resizeObservers: { callback: ResizeObserverCallback; targets: Element[] }[] = []

class ResizeObserverMock {
  targets: Element[] = []
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObservers.push(this)
  }
  observe(target: Element) {
    this.targets.push(target)
  }
  unobserve() {}
  disconnect() {}
}

const resizeTextareaTo = (height: number) => {
  const textarea = getInput()

  Object.defineProperty(textarea, 'offsetHeight', { configurable: true, value: height })

  act(() => {
    resizeObservers
      .filter(({ targets }) => targets.includes(textarea))
      .forEach(({ callback }) => callback([], undefined as unknown as ResizeObserver))
  })
}

describe('ChatPromptEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resizeObservers = []
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
    setFeatureFlags(FeatureFlags.AI_FINANCE_ASSISTANT)
    mockAgentType = AiAgentTypeEnum.billing
    mockState = buildState()
  })

  describe('GIVEN the prompt is empty', () => {
    describe('WHEN the component renders', () => {
      it('THEN should disable the submit button', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        expect(getSubmitButton()).toBeDisabled()
      })
    })

    describe('WHEN the form is submitted', () => {
      it('THEN should not call the submit handler', async () => {
        const onSubmit = jest.fn()

        render(<ChatPromptEditor onSubmit={onSubmit} />)

        await userEvent.type(getInput(), '{Enter}')

        expect(onSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the user typed a message', () => {
    describe('WHEN the message is present', () => {
      it('THEN should enable the submit button', async () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        await userEvent.type(getInput(), 'hello')

        expect(getSubmitButton()).not.toBeDisabled()
      })
    })

    describe('WHEN clicking the submit button', () => {
      it('THEN should submit the message and reset the form', async () => {
        const onSubmit = jest.fn()

        render(<ChatPromptEditor onSubmit={onSubmit} />)

        await userEvent.type(getInput(), 'hello')
        await userEvent.click(getSubmitButton())

        expect(onSubmit).toHaveBeenCalledWith({ message: 'hello' }, expect.anything())
        expect(getInput()).toHaveValue('')
      })
    })

    describe('WHEN pressing Enter', () => {
      it('THEN should submit the message', async () => {
        const onSubmit = jest.fn()

        render(<ChatPromptEditor onSubmit={onSubmit} />)

        await userEvent.type(getInput(), 'hello{Enter}')

        expect(onSubmit).toHaveBeenCalledWith({ message: 'hello' }, expect.anything())
      })
    })

    describe('WHEN pressing Shift+Enter', () => {
      it('THEN should insert a new line instead of submitting', async () => {
        const onSubmit = jest.fn()

        render(<ChatPromptEditor onSubmit={onSubmit} />)

        await userEvent.type(getInput(), 'hello{Shift>}{Enter}{/Shift}world')

        expect(onSubmit).not.toHaveBeenCalled()
        expect(getInput()).toHaveValue('hello\nworld')
      })
    })
  })

  describe('GIVEN a response is being generated', () => {
    describe('WHEN the chat is loading', () => {
      it('THEN should disable the input', () => {
        mockState = buildState({ isLoading: true })

        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        expect(getInput()).toBeDisabled()
      })
    })

    describe('WHEN the chat is streaming', () => {
      it('THEN should disable the input', () => {
        mockState = buildState({ isStreaming: true })

        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        expect(getInput()).toBeDisabled()
      })
    })
  })

  describe('GIVEN the editor is disabled via props', () => {
    describe('WHEN the component renders', () => {
      it('THEN should disable the input and the submit button', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} disabled />)

        expect(getInput()).toBeDisabled()
        expect(getSubmitButton()).toBeDisabled()
      })
    })
  })

  describe('GIVEN the gradient above the prompt input', () => {
    describe('WHEN the textarea is below the height threshold', () => {
      it('THEN should not display the gradient', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        resizeTextareaTo(GRADIENT_MIN_TEXTAREA_HEIGHT - 1)

        expect(screen.queryByTestId(CHAT_PROMPT_EDITOR_GRADIENT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the textarea reaches the height threshold', () => {
      it('THEN should display the gradient', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        resizeTextareaTo(GRADIENT_MIN_TEXTAREA_HEIGHT)

        expect(screen.getByTestId(CHAT_PROMPT_EDITOR_GRADIENT_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the textarea shrinks back below the threshold', () => {
      it('THEN should hide the gradient again', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        resizeTextareaTo(GRADIENT_MIN_TEXTAREA_HEIGHT)
        resizeTextareaTo(GRADIENT_MIN_TEXTAREA_HEIGHT - 1)

        expect(screen.queryByTestId(CHAT_PROMPT_EDITOR_GRADIENT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the agent selector', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the selected agent label', () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        expect(screen.getByTestId(CHAT_PROMPT_EDITOR_AGENT_SELECTOR_TEST_ID)).toHaveTextContent(
          AGENT_TYPE_LABELS[AiAgentTypeEnum.billing],
        )
      })
    })

    describe('WHEN selecting the other agent', () => {
      it('THEN should switch the agent type', async () => {
        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        await userEvent.click(screen.getByTestId(CHAT_PROMPT_EDITOR_AGENT_SELECTOR_TEST_ID))

        await userEvent.click(await screen.findByText(AGENT_TYPE_LABELS[AiAgentTypeEnum.finance]))

        expect(mockSetAgentType).toHaveBeenCalledWith(AiAgentTypeEnum.finance)
      })
    })

    describe('WHEN the finance assistant feature flag is not present', () => {
      it('THEN should not display the agent selector', () => {
        setFeatureFlags([])

        render(<ChatPromptEditor onSubmit={jest.fn()} />)

        expect(
          screen.queryByTestId(CHAT_PROMPT_EDITOR_AGENT_SELECTOR_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
