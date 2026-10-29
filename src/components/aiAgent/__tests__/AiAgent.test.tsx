import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AI_AGENT_ERROR_TEST_ID, AI_AGENT_NAV_TEST_ID, AiAgent } from '~/components/aiAgent/AiAgent'
import { CHAT_CONVERSATION_TEST_ID } from '~/components/aiAgent/ChatConversation'
import { CHAT_HISTORY_ITEM_TEST_ID, CHAT_HISTORY_TEST_ID } from '~/components/aiAgent/ChatHistory'
import {
  CHAT_PROMPT_EDITOR_INPUT_TEST_ID,
  CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID,
} from '~/components/aiAgent/ChatPromptEditor'
import {
  PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID,
  PANEL_AI_AGENT_WELCOME_TEST_ID,
} from '~/components/aiAgent/PanelAiAgent'
import { ListAiConversationsDocument } from '~/generated/graphql'
import { AiAgentProvider, AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { render, TestMocksType } from '~/test-utils'

jest.mock('~/components/aiAgent/llmOutputs', () => ({
  Message: ({ message }: { message: { message: string } }) => <span>{message.message}</span>,
}))

const PANEL_TEST_ID = 'ai-panel-element'

jest.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div data-test="ai-panel-element">{children}</div>
  ),
  PanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

let mockPanelShouldThrow = false

jest.mock('~/components/aiAgent/PanelWrapper', () => {
  const actual = jest.requireActual('~/components/aiAgent/PanelWrapper')

  return {
    ...actual,
    PanelWrapper: (props: Parameters<typeof actual.PanelWrapper>[0]) => {
      if (mockPanelShouldThrow) {
        throw new Error('panel exploded')
      }

      return actual.PanelWrapper(props)
    },
  }
})

const DEFAULT_MEMBERSHIPS = [
  { id: 'membership-1', organization: { id: 'org-1', slug: 'test-org' } },
  { id: 'membership-2', organization: { id: 'org-2', slug: 'second-org' } },
]

let mockMemberships = DEFAULT_MEMBERSHIPS

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
    currentUser: {
      id: 'user-1',
      memberships: mockMemberships,
    },
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

const mockCreateAiConversation = jest.fn()
const mockGetAiConversation = jest.fn()

let mockCreateLoading = false

jest.mock('~/components/aiAgent/hooks/useCreateAiConversation', () => ({
  useCreateAiConversation: () => ({
    createAiConversation: mockCreateAiConversation,
    loading: mockCreateLoading,
    error: undefined,
  }),
}))

jest.mock('~/components/aiAgent/hooks/getAiConversation', () => ({
  useGetAiConversation: () => ({
    getAiConversation: mockGetAiConversation,
  }),
}))

const STORED_CONVERSATION = {
  data: {
    aiConversation: {
      id: 'conv-1',
      name: 'Unpaid invoices question',
      messages: [
        { content: 'Give me the 3 last unpaid invoices', type: 'message.input' },
        { content: 'Here are your unpaid invoices...', type: 'message.output' },
      ],
    },
  },
}

const OpenPanelProbe = ({ agentType }: { agentType: AiAgentTypeEnum }) => {
  const { openPanelWithAgent } = useAiAgent()

  return (
    <>
      <button data-test="open-ai-panel" onClick={() => openPanelWithAgent(agentType)}>
        open
      </button>
      <button
        data-test="switch-to-finance-agent"
        onClick={() => openPanelWithAgent(AiAgentTypeEnum.finance)}
      >
        switch
      </button>
    </>
  )
}

const mocks: TestMocksType = [
  {
    request: {
      query: ListAiConversationsDocument,
      variables: { limit: 3 },
    },
    result: {
      data: {
        aiConversations: {
          __typename: 'AiConversationCollection',
          collection: [
            {
              __typename: 'AiConversation',
              id: 'conv-1',
              name: 'Unpaid invoices question',
              updatedAt: '2026-07-13T10:00:00Z',
            },
          ],
        },
      },
    },
  },
]

const renderAiAgent = async (agentType: AiAgentTypeEnum = AiAgentTypeEnum.billing) => {
  await act(() =>
    render(
      <AiAgentProvider>
        <OpenPanelProbe agentType={agentType} />
        <AiAgent />
      </AiAgentProvider>,
      { mocks },
    ),
  )
}

const openPanel = async () => {
  await userEvent.click(screen.getByTestId('open-ai-panel'))
}

const getHistoryButton = () =>
  screen.queryByTestId('history/medium')?.closest('button') as HTMLButtonElement | undefined

const openStoredConversation = async () => {
  await openPanel()
  await userEvent.click(getHistoryButton() as HTMLButtonElement)

  const [item] = await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)

  await userEvent.click(item)

  await waitFor(() => {
    expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
  })
}

const submitPrompt = async (message: string) => {
  await userEvent.type(screen.getByTestId(CHAT_PROMPT_EDITOR_INPUT_TEST_ID), message)
  await userEvent.click(screen.getByTestId(CHAT_PROMPT_EDITOR_SUBMIT_BUTTON_TEST_ID))
}

const navigateTo = async (path: string) => {
  await act(async () => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

describe('AiAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAiConversation.mockResolvedValue(STORED_CONVERSATION)
    mockCreateLoading = false
    mockMemberships = DEFAULT_MEMBERSHIPS
    localStorage.clear()
    mockPanelShouldThrow = false
    window.history.pushState({}, '', '/test-org/analytics')
  })

  describe('GIVEN the current path is outside a known organization', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render nothing', async () => {
        window.history.pushState({}, '', '/unknown-org/analytics')

        await renderAiAgent()

        expect(screen.queryByTestId(AI_AGENT_NAV_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the current path opted out of the AI agent', () => {
    describe('WHEN the component renders on a creation flow', () => {
      it('THEN should render nothing', async () => {
        window.history.pushState({}, '', '/test-org/create/plans')

        await renderAiAgent()

        expect(screen.queryByTestId(AI_AGENT_NAV_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a valid organization path', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the navigation bar with the panel closed', async () => {
        await renderAiAgent()

        expect(screen.getByTestId(AI_AGENT_NAV_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN opening the billing agent panel', () => {
      it('THEN should display the welcome view with the history button', async () => {
        await renderAiAgent()
        await openPanel()

        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
        expect(getHistoryButton()).toBeInTheDocument()
      })
    })

    describe('WHEN opening the finance agent panel', () => {
      it('THEN should not display the history button', async () => {
        await renderAiAgent(AiAgentTypeEnum.finance)
        await openPanel()

        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
        expect(getHistoryButton()).toBeUndefined()
      })
    })
  })

  describe('GIVEN the panel body crashes while rendering', () => {
    describe('WHEN the panel is opened', () => {
      it('THEN should keep the nav rail and the panel mounted with an in-panel fallback', async () => {
        mockPanelShouldThrow = true

        await renderAiAgent()
        await openPanel()

        expect(screen.getByTestId(AI_AGENT_ERROR_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(AI_AGENT_NAV_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PANEL_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the history view', () => {
    describe('WHEN clicking the history button', () => {
      it('THEN should display the conversations list', async () => {
        await renderAiAgent()
        await openPanel()

        await userEvent.click(getHistoryButton() as HTMLButtonElement)

        expect(screen.getByTestId(CHAT_HISTORY_TEST_ID)).toBeInTheDocument()
        expect(await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)).toHaveLength(1)
      })
    })

    describe('WHEN clicking a history item', () => {
      it('THEN should close the history and display the restored conversation', async () => {
        await renderAiAgent()
        await openPanel()

        await userEvent.click(getHistoryButton() as HTMLButtonElement)

        const [item] = await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)

        await userEvent.click(item)

        await waitFor(() => {
          expect(screen.queryByTestId(CHAT_HISTORY_TEST_ID)).not.toBeInTheDocument()
        })

        const conversation = screen.getByTestId(CHAT_CONVERSATION_TEST_ID)

        expect(conversation).toHaveTextContent('Give me the 3 last unpaid invoices')
        expect(conversation).toHaveTextContent('Here are your unpaid invoices...')
      })
    })

    describe('WHEN clicking the back button from the history', () => {
      it('THEN should return to the welcome view', async () => {
        await renderAiAgent()
        await openPanel()

        await userEvent.click(getHistoryButton() as HTMLButtonElement)

        const backButton = screen
          .getByTestId('arrow-left/medium')
          .closest('button') as HTMLButtonElement

        await userEvent.click(backButton)

        expect(screen.queryByTestId(CHAT_HISTORY_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a conversation opened under an organization', () => {
    describe('WHEN the user switches to another organization', () => {
      it('THEN should drop the conversation and return to the welcome view', async () => {
        await renderAiAgent()
        await openStoredConversation()

        await navigateTo('/second-org/analytics')

        expect(screen.queryByTestId(CHAT_CONVERSATION_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the user navigates inside the same organization', () => {
      it('THEN should keep the conversation', async () => {
        await renderAiAgent()
        await openStoredConversation()

        await navigateTo('/test-org/customers')

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the current organization is renamed', () => {
      it('THEN should keep the conversation', async () => {
        await renderAiAgent()
        await openStoredConversation()

        mockMemberships = [
          { id: 'membership-1', organization: { id: 'org-1', slug: 'renamed-org' } },
          DEFAULT_MEMBERSHIPS[1],
        ]

        await navigateTo('/renamed-org/settings')

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a legacy slug-less path redirects back to the same organization', () => {
      it('THEN should keep the conversation', async () => {
        await renderAiAgent()
        await openStoredConversation()

        await navigateTo('/customers')
        await navigateTo('/test-org/customers')

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a conversation creation still in flight', () => {
    const submitAndCaptureCompletion = async () => {
      let capturedOnCompleted: ((data: unknown) => void) | undefined

      mockCreateAiConversation.mockImplementation(({ onCompleted }) => {
        capturedOnCompleted = onCompleted
      })

      await openPanel()
      await submitPrompt('hello')

      return async () => {
        await act(async () => {
          capturedOnCompleted?.({ createAiConversation: { id: 'conv-from-first-org' } })
        })
      }
    }

    describe('WHEN it completes after the user switched organization', () => {
      it('THEN should ignore the stale answer', async () => {
        await renderAiAgent()

        const completeCreation = await submitAndCaptureCompletion()

        await navigateTo('/second-org/analytics')
        await completeCreation()

        expect(screen.queryByTestId(CHAT_CONVERSATION_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN it completes after the panel was unmounted and the organization changed', () => {
      it('THEN should ignore the stale answer', async () => {
        await renderAiAgent()

        const completeCreation = await submitAndCaptureCompletion()

        await navigateTo('/test-org/create/plans')
        await navigateTo('/second-org/analytics')
        await completeCreation()

        expect(screen.queryByTestId(CHAT_CONVERSATION_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the organization switch lands on a page hiding the panel', () => {
      it('THEN should ignore the stale answer', async () => {
        await renderAiAgent()

        const completeCreation = await submitAndCaptureCompletion()

        await navigateTo('/second-org/create/plans')
        await completeCreation()
        await navigateTo('/second-org/analytics')

        expect(screen.queryByTestId(CHAT_CONVERSATION_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the user switches organization while it is pending', () => {
      it('THEN should drop the prompt echoed under the previous organization', async () => {
        mockCreateLoading = true

        await renderAiAgent()
        await submitAndCaptureCompletion()

        expect(screen.getByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).toBeInTheDocument()

        await navigateTo('/second-org/analytics')

        expect(screen.queryByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user switches agent while it is pending', () => {
      it('THEN should drop the prompt echoed by the previous agent', async () => {
        mockCreateLoading = true

        await renderAiAgent()
        await submitAndCaptureCompletion()

        expect(screen.getByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).toBeInTheDocument()

        await userEvent.click(screen.getByTestId('switch-to-finance-agent'))

        expect(screen.queryByTestId(PANEL_AI_AGENT_INITIAL_PROMPT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN it completes while the user stayed in the same organization', () => {
      it('THEN should start the conversation', async () => {
        await renderAiAgent()

        const completeCreation = await submitAndCaptureCompletion()

        await navigateTo('/test-org/customers')
        await completeCreation()

        expect(screen.getByTestId(CHAT_CONVERSATION_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a history restore still in flight', () => {
    describe('WHEN it resolves after the user switched organization', () => {
      it('THEN should ignore the restored conversation', async () => {
        let resolveRestore: ((value: unknown) => void) | undefined

        mockGetAiConversation.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveRestore = resolve
            }),
        )

        await renderAiAgent()
        await openPanel()
        await userEvent.click(getHistoryButton() as HTMLButtonElement)

        const [item] = await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)

        await userEvent.click(item)
        await navigateTo('/second-org/analytics')

        await act(async () => {
          resolveRestore?.(STORED_CONVERSATION)
        })

        expect(screen.queryByTestId(CHAT_CONVERSATION_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
