import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CHAT_SHORTCUTS_TEST_ID, ChatShortcuts } from '~/components/aiAgent/ChatShortcuts'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const getShortcutButtons = () =>
  within(screen.getByTestId(CHAT_SHORTCUTS_TEST_ID)).getAllByTestId('button')

describe('ChatShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the billing agent is selected', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the six billing shortcuts', () => {
        render(<ChatShortcuts agentType={AiAgentTypeEnum.billing} onSubmit={jest.fn()} />)

        expect(getShortcutButtons()).toHaveLength(6)
      })
    })

    describe('WHEN clicking a shortcut', () => {
      it('THEN should submit the shortcut prompt message', async () => {
        const onSubmit = jest.fn()

        render(<ChatShortcuts agentType={AiAgentTypeEnum.billing} onSubmit={onSubmit} />)

        await userEvent.click(getShortcutButtons()[0])

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledWith({ message: expect.any(String) })
        expect(onSubmit.mock.calls[0][0].message).not.toHaveLength(0)
      })
    })
  })

  describe('GIVEN the finance agent is selected', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the six finance shortcuts', () => {
        render(<ChatShortcuts agentType={AiAgentTypeEnum.finance} onSubmit={jest.fn()} />)

        expect(getShortcutButtons()).toHaveLength(6)
      })

      it('THEN should display a different set of shortcuts than the billing agent', () => {
        const { unmount } = render(
          <ChatShortcuts agentType={AiAgentTypeEnum.billing} onSubmit={jest.fn()} />,
        )
        const billingLabels = getShortcutButtons().map((button) => button.textContent)

        unmount()

        render(<ChatShortcuts agentType={AiAgentTypeEnum.finance} onSubmit={jest.fn()} />)
        const financeLabels = getShortcutButtons().map((button) => button.textContent)

        expect(financeLabels).not.toEqual(billingLabels)
      })
    })
  })
})
