import { screen } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { createHighlighter } from 'shiki/bundle/web'

import { AI_AGENT_NAV_TEST_ID, AiAgent } from '~/components/aiAgent/AiAgent'
import { PANEL_AI_AGENT_WELCOME_TEST_ID } from '~/components/aiAgent/PanelAiAgent'
import { AiAgentProvider } from '~/hooks/aiAgent/useAiAgent'
import { render } from '~/test-utils'

jest.mock('shiki/bundle/web', () => ({
  bundledLanguages: { javascript: jest.fn() },
  createHighlighter: jest.fn(() => Promise.resolve({})),
}))

jest.mock('shiki/themes/catppuccin-latte.mjs', () => ({}), { virtual: true })

jest.mock('@llm-ui/code', () => ({ loadHighlighter: jest.fn() }))
jest.mock('@llm-ui/react', () => ({}))
jest.mock('@llm-ui/markdown', () => ({}))
jest.mock('~/components/aiAgent/llmOutputs/Markdown', () => ({ MarkdownContent: () => null }))

jest.mock('react-resizable-panels', () => ({
  Panel: ({ children }: PropsWithChildren) => <section aria-label="AI panel">{children}</section>,
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
    currentUser: {
      id: 'user-1',
      memberships: [{ id: 'membership-1', organization: { id: 'org-1', slug: 'test-org' } }],
    },
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => true }),
}))

it('keeps the closed AI panel shell mounted without initializing a highlighter', () => {
  window.history.pushState({}, '', '/test-org/analytics')
  render(
    <AiAgentProvider>
      <AiAgent />
    </AiAgentProvider>,
  )

  expect(screen.getByTestId(AI_AGENT_NAV_TEST_ID)).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'AI panel' })).toBeInTheDocument()
  expect(screen.queryByTestId(PANEL_AI_AGENT_WELCOME_TEST_ID)).not.toBeInTheDocument()
  expect(createHighlighter).not.toHaveBeenCalled()
})
