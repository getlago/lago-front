import { LLMOutputComponent } from '@llm-ui/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createBlockMatch } from './fixtures'

import { LazyCodeblock } from '../LazyCodeblock'

let mockFailImport = true

jest.mock('../Codeblock', () => {
  if (mockFailImport) throw new Error('chunk unavailable')

  const Codeblock = ({ blockMatch }: Parameters<LLMOutputComponent>[0]): JSX.Element => (
    <div>{`highlighted: ${blockMatch.output}`}</div>
  )

  return { Codeblock }
})

jest.mock('@llm-ui/code', () => ({
  parseCompleteMarkdownCodeBlock: (output: string) => ({
    code: output.split('\n').slice(1, -1).join('\n'),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: () => 'Retry' }),
}))

describe('LazyCodeblock', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFailImport = true
  })

  it('keeps plaintext on import failure and retries the named export when requested', async () => {
    render(<LazyCodeblock blockMatch={createBlockMatch('```go\npackage main\n```')} />)

    expect(screen.getByText('package main')).toBeInTheDocument()
    const retry = await screen.findByRole('button', { name: 'Retry' })

    expect(screen.getByText('package main')).toBeInTheDocument()
    mockFailImport = false
    await userEvent.click(retry)

    expect(await screen.findByText(/highlighted:/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  it('renders plaintext while loading and then renders the named Codeblock export', async () => {
    mockFailImport = false
    render(<LazyCodeblock blockMatch={createBlockMatch('```go\npackage other\n```')} />)

    expect(screen.getByText('package other')).toBeInTheDocument()
    await act(async () => undefined)
    expect(screen.getByText(/highlighted:/)).toBeInTheDocument()
  })
})
