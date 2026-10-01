import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client'
import { act, render, waitFor } from '@testing-library/react'
import { PropsWithChildren } from 'react'

import { ChatConversation } from '~/components/aiAgent/ChatConversation'
import { OnConversationSubscription } from '~/generated/graphql'
import { ChatMessage, ChatStatus } from '~/hooks/aiAgent/aiAgentReducer'
import { AiAgentProvider, AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'

import { useOnConversation } from '../useOnConversation'

jest.mock('~/components/aiAgent/llmOutputs', () => ({
  Message: ({ message }: { message: ChatMessage }) => <span>{message.message}</span>,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

type Stream = {
  id: string
  next: (chunk: string | null, done?: boolean) => void
  error: (error: Error) => void
  unsubscribe: jest.Mock
}

type ConversationResult = ReturnType<typeof useAiAgent> & {
  subscription: ReturnType<typeof useOnConversation>
}

const renderConversation = (): ReturnType<typeof render> & {
  streams: Stream[]
  result: { current: ConversationResult }
} => {
  const streams: Stream[] = []
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const unsubscribe = jest.fn()

          streams.push({
            id: operation.variables.id,
            next: (chunk, done = false) => {
              const data: OnConversationSubscription = { aiConversationStreamed: { chunk, done } }

              observer.next({ data })
            },
            error: (error) => observer.error(error),
            unsubscribe,
          })
          return unsubscribe
        }),
    ),
  })
  const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
    <ApolloProvider client={client}>
      <AiAgentProvider>{children}</AiAgentProvider>
    </ApolloProvider>
  )
  let current: ConversationResult | undefined
  const Conversation = (): JSX.Element => {
    const agent = useAiAgent()
    const subscription = useOnConversation({
      conversationId:
        agent.agentType === AiAgentTypeEnum.billing ? agent.conversationId : undefined,
    })

    current = { ...agent, subscription }
    return <ChatConversation subscription={subscription} />
  }
  const view = render(<Conversation />, { wrapper })
  const result = {
    get current(): ConversationResult {
      if (!current) throw new Error('Conversation has not rendered')
      return current
    },
  }

  act(() => result.current.setAgentType(AiAgentTypeEnum.billing))
  act(() => result.current.startNewConversation({ convId: 'conversation-1', message: 'hello' }))

  return { ...view, result, streams }
}

describe('useOnConversation', () => {
  const scrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    })
  })

  afterAll(() => {
    if (scrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollTo)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
    }
  })

  beforeEach(() => localStorage.clear())

  it('appends identical consecutive events even across separate renders', () => {
    const { result, streams } = renderConversation()

    act(() => streams[0].next('ha'))
    act(() => streams[0].next('ha'))

    expect(result.current.lastAssistantMessage?.message).toBe('haha')
    expect(result.current.state.isStreaming).toBe(true)
  })

  it('preserves batched chunks and appends the final chunk before marking the message done', () => {
    const { result, streams } = renderConversation()

    act(() => {
      streams[0].next('one ')
      streams[0].next('two ')
      streams[0].next('three', true)
      streams[0].next('late chunk')
    })

    expect(result.current.lastAssistantMessage).toMatchObject({
      message: 'one two three',
      status: ChatStatus.done,
    })
    expect(result.current.state.isStreaming).toBe(false)
    expect(result.current.state.isLoading).toBe(false)
  })

  it('routes a restarted subscription to the new assistant message', () => {
    const { result, streams } = renderConversation()

    act(() => streams[0].next('first answer', true))
    act(() => {
      result.current.addNewMessage('follow up')
      result.current.subscription.restart()
    })
    act(() => streams[streams.length - 1].next('second answer', true))

    expect(result.current.state.messages.map(({ message }) => message)).toEqual([
      'hello',
      'first answer',
      'follow up',
      'second answer',
    ])
    expect(result.current.lastAssistantMessage?.status).toBe(ChatStatus.done)
  })

  it('ignores events from a replaced conversation and releases its subscription', async () => {
    const { result, streams } = renderConversation()

    act(() => result.current.startNewConversation({ convId: 'conversation-2', message: 'new' }))
    act(() => {
      streams[0].next('stale', true)
      streams[1].next('current', true)
    })

    expect(result.current.lastAssistantMessage?.message).toBe('current')
    await waitFor(() => expect(streams[0].unsubscribe).toHaveBeenCalledTimes(1))
  })

  it('ignores late billing events after switching agents and cancels on unmount', async () => {
    const { result, streams, unmount } = renderConversation()

    act(() => result.current.setAgentType(AiAgentTypeEnum.finance))
    act(() => {
      result.current.addNewMessage('finance question', 'finance-exchange')
      streams[0].next('stale billing answer', true)
    })

    expect(result.current.lastAssistantMessage).toMatchObject({
      id: 'finance-exchange',
      message: '',
      status: ChatStatus.pending,
    })
    expect(result.current.state.isLoading).toBe(true)
    await waitFor(() => expect(streams[0].unsubscribe).toHaveBeenCalledTimes(1))

    act(() => result.current.setAgentType(AiAgentTypeEnum.billing))
    act(() => result.current.startNewConversation({ convId: 'conversation-2', message: 'new' }))
    unmount()
    act(() => streams[1].next('after unmount', true))
    await waitFor(() => expect(streams[1].unsubscribe).toHaveBeenCalledTimes(1))
  })

  it('keeps subscription errors available to the conversation and supports restarting', () => {
    const { result, streams } = renderConversation()

    act(() => streams[0].error(new Error('stream failed')))

    expect(result.current.subscription.error?.message).toContain('stream failed')

    act(() => result.current.subscription.restart())
    act(() => streams[1].next('recovered', true))

    expect(result.current.subscription.error).toBeUndefined()
    expect(result.current.lastAssistantMessage?.message).toBe('recovered')
  })
})
