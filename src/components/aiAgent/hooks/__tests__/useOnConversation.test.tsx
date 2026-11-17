import { renderHook } from '@testing-library/react'

import { useOnConversation } from '~/components/aiAgent/hooks/useOnConversation'
import { LagoApiError, useOnConversationSubscription } from '~/generated/graphql'

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useOnConversationSubscription: jest.fn(),
}))

const mockUseOnConversationSubscription = jest.mocked(useOnConversationSubscription)

type OnDataArgs = Parameters<
  NonNullable<NonNullable<Parameters<typeof useOnConversationSubscription>[0]>['onData']>
>[0]

const emit = (event: { chunk: string | null; done: boolean } | undefined) => {
  const options = mockUseOnConversationSubscription.mock.calls.at(-1)?.[0]

  options?.onData?.({
    data: { data: event ? { aiConversationStreamed: event } : undefined },
  } as unknown as OnDataArgs)
}

describe('useOnConversation', () => {
  const onChunk = jest.fn()
  const onDone = jest.fn()

  beforeEach(() => {
    mockUseOnConversationSubscription.mockReset()
    onChunk.mockReset()
    onDone.mockReset()
  })

  describe('GIVEN a conversation id', () => {
    describe('WHEN the hook subscribes to the stream', () => {
      it('THEN should silence the token_expired error that ends a stream', () => {
        renderHook(() => useOnConversation({ conversationId: 'conversation-1', onChunk, onDone }))

        expect(mockUseOnConversationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: false,
            variables: { id: 'conversation-1' },
            context: { silentErrorCodes: [LagoApiError.TokenExpired] },
          }),
        )
      })
    })

    describe('WHEN chunks arrive', () => {
      it('THEN should pass every chunk on, including one equal to the previous one', () => {
        renderHook(() => useOnConversation({ conversationId: 'conversation-1', onChunk, onDone }))

        emit({ chunk: 'Invoices:', done: false })
        emit({ chunk: '\n', done: false })
        emit({ chunk: '\n', done: false })
        emit({ chunk: '| # |', done: false })

        expect(onChunk.mock.calls).toEqual([['Invoices:'], ['\n'], ['\n'], ['| # |']])
        expect(onDone).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the stream completes', () => {
      it('THEN should call onDone without a chunk', () => {
        renderHook(() => useOnConversation({ conversationId: 'conversation-1', onChunk, onDone }))

        emit({ chunk: null, done: true })

        expect(onDone).toHaveBeenCalledTimes(1)
        expect(onChunk).not.toHaveBeenCalled()
      })
    })

    describe('WHEN an event has no data', () => {
      it('THEN should ignore it', () => {
        renderHook(() => useOnConversation({ conversationId: 'conversation-1', onChunk, onDone }))

        emit(undefined)

        expect(onChunk).not.toHaveBeenCalled()
        expect(onDone).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no conversation id', () => {
    describe('WHEN the hook renders', () => {
      it('THEN should skip the subscription', () => {
        renderHook(() => useOnConversation({ conversationId: undefined, onChunk, onDone }))

        expect(mockUseOnConversationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ skip: true }),
        )
      })
    })
  })
})
