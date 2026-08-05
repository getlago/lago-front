import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CHAT_MESSAGE_ERROR_TEST_ID,
  CHAT_MESSAGE_INFO_TEST_ID,
  CHAT_MESSAGE_LOADING_FINANCE_TEST_ID,
  CHAT_MESSAGE_LOADING_TEST_ID,
  CHAT_MESSAGE_RECEIVED_TEST_ID,
  CHAT_MESSAGE_SENT_TEST_ID,
  ChatMessages,
} from '~/components/aiAgent/ChatMessages'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('ChatMessages', () => {
  describe('GIVEN a sent message', () => {
    describe('WHEN it renders', () => {
      it('THEN should display its content', () => {
        render(<ChatMessages.Sent>hello</ChatMessages.Sent>)

        expect(screen.getByTestId(CHAT_MESSAGE_SENT_TEST_ID)).toHaveTextContent('hello')
      })
    })
  })

  describe('GIVEN a received message', () => {
    describe('WHEN it renders', () => {
      it('THEN should display its content', () => {
        render(<ChatMessages.Received>answer</ChatMessages.Received>)

        expect(screen.getByTestId(CHAT_MESSAGE_RECEIVED_TEST_ID)).toHaveTextContent('answer')
      })
    })
  })

  describe('GIVEN a loading message', () => {
    describe('WHEN the billing agent is loading', () => {
      it('THEN should display the plain pulse loader', () => {
        render(<ChatMessages.Loading agentType={AiAgentTypeEnum.billing} />)

        expect(screen.getByTestId(CHAT_MESSAGE_LOADING_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CHAT_MESSAGE_LOADING_FINANCE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the finance agent is loading', () => {
      it('THEN should display the finance loading message', () => {
        render(<ChatMessages.Loading agentType={AiAgentTypeEnum.finance} />)

        expect(screen.getByTestId(CHAT_MESSAGE_LOADING_FINANCE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CHAT_MESSAGE_LOADING_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an error message', () => {
    describe('WHEN no action is provided', () => {
      it('THEN should display the error without an action button', () => {
        render(<ChatMessages.Error>something broke</ChatMessages.Error>)

        expect(screen.getByTestId(CHAT_MESSAGE_ERROR_TEST_ID)).toHaveTextContent('something broke')
        expect(screen.queryByTestId('button')).not.toBeInTheDocument()
      })
    })

    describe('WHEN an action is provided', () => {
      it('THEN should call the action when the button is clicked', async () => {
        const onAction = jest.fn()

        render(
          <ChatMessages.Error onAction={onAction} actionLabel="Retry">
            something broke
          </ChatMessages.Error>,
        )

        await userEvent.click(screen.getByTestId('button'))

        expect(onAction).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN an info message', () => {
    describe('WHEN it is loading', () => {
      it('THEN should display the content', () => {
        render(<ChatMessages.Info isLoading>working on it</ChatMessages.Info>)

        expect(screen.getByTestId(CHAT_MESSAGE_INFO_TEST_ID)).toHaveTextContent('working on it')
      })
    })

    describe('WHEN a duration is provided', () => {
      it('THEN should display a human-readable duration', () => {
        render(<ChatMessages.Info duration={90}>done</ChatMessages.Info>)

        expect(screen.getByText(/1\s?m/)).toBeInTheDocument()
      })
    })
  })
})
