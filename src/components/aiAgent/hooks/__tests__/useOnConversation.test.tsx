import { renderHook } from '@testing-library/react'

import { useOnConversation } from '~/components/aiAgent/hooks/useOnConversation'
import {
  AiConversationToolCallStatusEnum,
  LagoApiError,
  useOnConversationSubscription,
} from '~/generated/graphql'

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useOnConversationSubscription: jest.fn(),
}))

const mockUseOnConversationSubscription = jest.mocked(useOnConversationSubscription)
const onPendingToolCalls = jest.fn()

const deliver = (aiConversationStreamed: Record<string, unknown>): void => {
  const options = mockUseOnConversationSubscription.mock.calls[0][0]

  options?.onData?.({ data: { data: { aiConversationStreamed } } } as never)
}

describe('useOnConversation', () => {
  beforeEach(() => {
    mockUseOnConversationSubscription.mockReset()
    onPendingToolCalls.mockReset()
  })

  describe('GIVEN a conversation id', () => {
    describe('WHEN the hook subscribes to the stream', () => {
      it('THEN should silence the token_expired error that ends a stream', () => {
        renderHook(() =>
          useOnConversation({ conversationId: 'conversation-1', onPendingToolCalls }),
        )

        expect(mockUseOnConversationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: false,
            variables: { id: 'conversation-1' },
            context: { silentErrorCodes: [LagoApiError.TokenExpired] },
          }),
        )
      })
    })
  })

  describe('GIVEN the stream ends on writes to confirm', () => {
    describe('WHEN the event arrives', () => {
      it('THEN should hand every pending write over, whatever the render timing', () => {
        const pendingToolCalls = [
          {
            id: 'tool-call-1',
            name: 'void_invoice',
            arguments: {},
            status: AiConversationToolCallStatusEnum.Pending,
          },
        ]

        renderHook(() =>
          useOnConversation({ conversationId: 'conversation-1', onPendingToolCalls }),
        )

        deliver({ chunk: null, done: true, pendingToolCalls })

        expect(onPendingToolCalls).toHaveBeenCalledWith(pendingToolCalls)
      })
    })

    describe('WHEN an event carries no pending write', () => {
      it('THEN should leave the pending writes alone', () => {
        renderHook(() =>
          useOnConversation({ conversationId: 'conversation-1', onPendingToolCalls }),
        )

        deliver({ chunk: 'Hello', done: false, pendingToolCalls: null })

        expect(onPendingToolCalls).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no conversation id', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should skip the subscription', () => {
        renderHook(() => useOnConversation({ conversationId: undefined, onPendingToolCalls }))

        expect(mockUseOnConversationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ skip: true }),
        )
      })
    })
  })
})
