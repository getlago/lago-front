import { renderHook } from '@testing-library/react'

import { useOnConversation } from '~/components/aiAgent/hooks/useOnConversation'
import { LagoApiError, useOnConversationSubscription } from '~/generated/graphql'

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useOnConversationSubscription: jest.fn(),
}))

const mockUseOnConversationSubscription = jest.mocked(useOnConversationSubscription)

describe('useOnConversation', () => {
  beforeEach(() => {
    mockUseOnConversationSubscription.mockReset()
  })

  describe('GIVEN a conversation id', () => {
    describe('WHEN the hook subscribes to the stream', () => {
      it('THEN should silence the token_expired error that ends a stream', () => {
        renderHook(() => useOnConversation({ conversationId: 'conversation-1' }))

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

  describe('GIVEN no conversation id', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should skip the subscription', () => {
        renderHook(() => useOnConversation({ conversationId: undefined }))

        expect(mockUseOnConversationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ skip: true }),
        )
      })
    })
  })
})
