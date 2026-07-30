import { screen } from '@testing-library/react'
import { NodeViewProps } from '@tiptap/react'

import { render } from '~/test-utils'

import * as ctx from '../../common/RichTextEditorContext'
import { CREDITS_BLOCK_VIEW_EMPTY_TEST_ID, CreditsBlockView } from '../CreditsBlockView'

jest.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const baseContext = {
  mode: 'edit',
  mentionValues: {},
  entities: {},
  images: {},
} as unknown as ReturnType<typeof ctx.useRichTextEditorContext>

const renderView = (attrs: { localId: string }, override = {}) => {
  jest.spyOn(ctx, 'useRichTextEditorContext').mockReturnValue({ ...baseContext, ...override })

  const nodeViewProps = {
    node: { attrs },
    updateAttributes: jest.fn(),
  } as unknown as NodeViewProps

  return render(<CreditsBlockView {...nodeViewProps} />)
}

describe('CreditsBlockView', () => {
  it('renders the empty state when there is no resolved wallet', () => {
    renderView({ localId: '' })

    expect(screen.getByTestId(CREDITS_BLOCK_VIEW_EMPTY_TEST_ID)).toBeInTheDocument()
  })

  it('renders the wallet name when resolved', () => {
    renderView(
      { localId: 'wl_1' },
      { entities: { wl_1: { entityId: 'wl_1', entityType: 'wallet', name: 'Tokens', code: '' } } },
    )

    expect(screen.getByText('Tokens')).toBeInTheDocument()
  })

  it('renders a minimal placeholder in preview mode (no interaction)', () => {
    const { container } = renderView(
      { localId: 'wl_1' },
      {
        mode: 'preview',
        entities: { wl_1: { entityId: 'wl_1', entityType: 'wallet', name: 'Tokens', code: '' } },
      },
    )

    expect(container).toHaveTextContent('Tokens')
    expect(screen.queryByTestId(CREDITS_BLOCK_VIEW_EMPTY_TEST_ID)).not.toBeInTheDocument()
  })
})
