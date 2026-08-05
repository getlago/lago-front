import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_HISTORY_ITEM_TEST_ID,
  CHAT_HISTORY_TEST_ID,
  ChatHistory,
} from '~/components/aiAgent/ChatHistory'
import { GetAiConversationDocument, ListAiConversationsDocument } from '~/generated/graphql'
import { ChatRole, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import { render, TestMocksType } from '~/test-utils'

const mockSetPreviousChatMessages = jest.fn()

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    setPreviousChatMessages: mockSetPreviousChatMessages,
  }),
}))

const conversationsListMock = {
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
          {
            __typename: 'AiConversation',
            id: 'conv-2',
            name: 'Churn rate question',
            updatedAt: '2026-07-12T10:00:00Z',
          },
        ],
      },
    },
  },
}

const conversationMock = (messages: Array<{ content: string; type: string }>) => ({
  request: {
    query: GetAiConversationDocument,
    variables: { id: 'conv-1' },
  },
  result: {
    data: {
      aiConversation: {
        __typename: 'AiConversationWithMessages',
        id: 'conv-1',
        name: 'Unpaid invoices question',
        messages: messages.map((message) => ({
          __typename: 'AiConversationMessage',
          ...message,
        })),
      },
    },
  },
})

describe('ChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the conversations list loads', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display one item per conversation', async () => {
        await act(() =>
          render(<ChatHistory />, {
            mocks: [conversationsListMock] as TestMocksType,
          }),
        )

        await waitFor(() => {
          expect(screen.getAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)).toHaveLength(2)
        })
      })
    })
  })

  describe('GIVEN the conversations list fails to load', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render nothing', async () => {
        await act(() =>
          render(<ChatHistory />, {
            mocks: [
              {
                request: {
                  query: ListAiConversationsDocument,
                  variables: { limit: 3 },
                },
                error: new Error('boom'),
              },
            ] as TestMocksType,
          }),
        )

        await waitFor(() => {
          expect(screen.queryByTestId(CHAT_HISTORY_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a conversation with messages', () => {
    describe('WHEN clicking its history item', () => {
      it('THEN should hide the history and restore the formatted messages', async () => {
        const hideHistory = jest.fn()

        await act(() =>
          render(<ChatHistory hideHistory={hideHistory} />, {
            mocks: [
              conversationsListMock,
              conversationMock([
                { content: 'Give me the 3 last unpaid invoices', type: 'message.input' },
                { content: 'Here are your unpaid invoices...', type: 'message.output' },
              ]),
            ] as TestMocksType,
          }),
        )

        const [firstItem] = await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)

        await userEvent.click(firstItem)

        await waitFor(() => {
          expect(hideHistory).toHaveBeenCalledTimes(1)
        })

        expect(mockSetPreviousChatMessages).toHaveBeenCalledWith({
          convId: 'conv-1',
          messages: [
            expect.objectContaining({
              role: ChatRole.user,
              message: 'Give me the 3 last unpaid invoices',
              status: ChatStatus.done,
            }),
            expect.objectContaining({
              role: ChatRole.assistant,
              message: 'Here are your unpaid invoices...',
              status: ChatStatus.done,
            }),
          ],
        })
      })
    })
  })

  describe('GIVEN the conversation fetch returns nothing', () => {
    describe('WHEN clicking its history item', () => {
      it('THEN should not hide the history nor touch the chat state', async () => {
        const hideHistory = jest.fn()

        await act(() =>
          render(<ChatHistory hideHistory={hideHistory} />, {
            mocks: [
              conversationsListMock,
              {
                request: {
                  query: GetAiConversationDocument,
                  variables: { id: 'conv-1' },
                },
                error: new Error('boom'),
              },
            ] as TestMocksType,
          }),
        )

        const [firstItem] = await screen.findAllByTestId(CHAT_HISTORY_ITEM_TEST_ID)

        await userEvent.click(firstItem)

        await waitFor(() => {
          expect(hideHistory).not.toHaveBeenCalled()
        })
        expect(mockSetPreviousChatMessages).not.toHaveBeenCalled()
      })
    })
  })
})
