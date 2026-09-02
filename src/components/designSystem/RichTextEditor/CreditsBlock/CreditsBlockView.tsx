import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { Locale, LocaleEnum } from '~/core/translations'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { WalletPreviewTable } from './WalletPreviewTable'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import SlashCommandBlockWrapper from '../SlashCommandBlockWrapper/SlashCommandBlockWrapper'

export const CREDITS_BLOCK_VIEW_EMPTY_TEST_ID = 'credits-block-view-empty'
const CREDITS_BLOCK_VIEW_RESOLVED_TEST_ID = 'credits-block-view-resolved'

export const CreditsBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const { entities, onCreditsCommand, mode, customerLocale } = useRichTextEditorContext()
  const { translate } = useInternationalization()

  const localId = (node.attrs.localId ?? '') as string
  const entity = localId ? entities[localId] : undefined
  const isEmpty = localId === '' || !entity
  const blockLabel = translate('text_1783352692386xocpgvrz3na')
  const displayName = entity?.name || blockLabel

  // Preview renders in the customer's locale (matches the discount block). The
  // amounts are denominated in the wallet's own currency, so we read it straight
  // off the resolved preview data rather than falling back to a customer/org
  // default — see entity.wallet.currency in the preview branch below.
  const effectiveLocale: Locale = (customerLocale ?? 'en') as Locale
  const { translateWithContextualLocal } = useContextualLocale(effectiveLocale)

  // Preview mode: render the read-only wallet preview table.
  if (mode === 'preview') {
    if (entity?.wallet && entity.wallet.rows.length > 0) {
      return (
        <NodeViewWrapper className="spacer" data-type="creditsBlock">
          <WalletPreviewTable
            data={entity.wallet}
            translate={translateWithContextualLocal}
            currency={entity.wallet.currency}
            locale={LocaleEnum[effectiveLocale]}
          />
        </NodeViewWrapper>
      )
    }

    // Empty or unresolved in preview — render nothing interactive.
    return <NodeViewWrapper className="spacer" data-type="creditsBlock" />
  }

  const handleClick = () => {
    onCreditsCommand?.({
      onSave: (attrs) => updateAttributes(attrs),
      editData: isEmpty ? undefined : { localId },
    })
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper className="spacer" data-type="creditsBlock">
        <div className="block-wrapper">
          <button
            type="button"
            className="pricing-block pricing-block--empty"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            tabIndex={0}
            data-test={CREDITS_BLOCK_VIEW_EMPTY_TEST_ID}
          >
            <span className="pricing-block__placeholder">
              {translate('text_1783352692385g9pml8ryold')}
            </span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="spacer" data-type="creditsBlock">
      <div className="block-wrapper" data-test={CREDITS_BLOCK_VIEW_RESOLVED_TEST_ID}>
        <SlashCommandBlockWrapper
          typeText={blockLabel}
          handleClick={handleClick}
          icon="wallet"
          displayText={displayName}
        />
      </div>
    </NodeViewWrapper>
  )
}
