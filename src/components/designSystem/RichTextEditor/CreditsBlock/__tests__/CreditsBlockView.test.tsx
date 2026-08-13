import { screen } from '@testing-library/react'
import { NodeViewProps } from '@tiptap/react'

import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { WalletPreviewData } from '~/core/serializers/buildWalletPreviewData'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import * as ctx from '../../common/RichTextEditorContext'
import { CREDITS_BLOCK_VIEW_EMPTY_TEST_ID, CreditsBlockView } from '../CreditsBlockView'
import { WALLET_PREVIEW_TABLE_TEST_ID } from '../WalletPreviewTable'

jest.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const baseContext = {
  mode: 'edit',
  mentionValues: {},
  entities: {},
  images: {},
} as unknown as ReturnType<typeof ctx.useRichTextEditorContext>

const walletPreview: WalletPreviewData = {
  name: 'Prepaid credits',
  currency: CurrencyEnum.Usd,
  expirationAt: null,
  appliesTo: { feeTypes: [], billableMetricCodes: [] },
  rows: [
    {
      kind: 'paid',
      isPrimary: true,
      billed: { type: 'oneTime' },
      units: { type: 'count', value: 100 },
      price: { type: 'displayAmount', amount: '100' },
    },
  ],
}

const walletEntity: EntityData = {
  entityId: 'wl_1',
  entityType: 'wallet',
  name: 'Prepaid credits',
  code: '',
  wallet: walletPreview,
}

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

  it('renders the wallet name when resolved in edit mode', () => {
    renderView({ localId: 'wl_1' }, { entities: { wl_1: walletEntity } })

    expect(screen.getByText('Prepaid credits')).toBeInTheDocument()
  })

  it('renders the wallet preview table in preview mode', () => {
    renderView({ localId: 'wl_1' }, { mode: 'preview', entities: { wl_1: walletEntity } })

    expect(screen.getByTestId(WALLET_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
    expect(screen.getByText('Prepaid credits')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.queryByTestId(CREDITS_BLOCK_VIEW_EMPTY_TEST_ID)).not.toBeInTheDocument()
  })

  it('renders nothing interactive in preview mode when the wallet has no preview data', () => {
    renderView(
      { localId: 'wl_1' },
      {
        mode: 'preview',
        entities: { wl_1: { entityId: 'wl_1', entityType: 'wallet', name: 'Tokens', code: '' } },
      },
    )

    expect(screen.queryByTestId(WALLET_PREVIEW_TABLE_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(CREDITS_BLOCK_VIEW_EMPTY_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByText('Tokens')).not.toBeInTheDocument()
  })
})
