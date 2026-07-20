import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import SlashCommandBlockWrapper from '../SlashCommandBlockWrapper/SlashCommandBlockWrapper'

export const CREDITS_BLOCK_VIEW_EMPTY_TEST_ID = 'credits-block-view-empty'
export const CREDITS_BLOCK_VIEW_RESOLVED_TEST_ID = 'credits-block-view-resolved'

export const CreditsBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const { entities, onCreditsCommand, mode } = useRichTextEditorContext()
  const { translate } = useInternationalization()

  const localId = (node.attrs.localId ?? '') as string
  const entity = localId ? entities[localId] : undefined
  const isEmpty = localId === '' || !entity
  const blockLabel = translate('text_1783352692386vc0tpd7owy3')
  const displayName = entity?.name || blockLabel

  // Preview mode: minimal placeholder, non-interactive (preview table is out of scope).
  if (mode === 'preview') {
    if (!entity) {
      return <NodeViewWrapper className="spacer" data-type="creditsBlock" />
    }

    return (
      <NodeViewWrapper className="spacer" data-type="creditsBlock">
        <div className="block-wrapper">
          <div className="pricing-block">
            <span className="pricing-block__label">{displayName}</span>
          </div>
        </div>
      </NodeViewWrapper>
    )
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
