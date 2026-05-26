import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import { PricingType } from '../extensions/PricingBlock.schema'

export const PRICING_BLOCK_VIEW_TEST_ID = 'pricing-block-view'
export const PRICING_BLOCK_VIEW_EMPTY_TEST_ID = 'pricing-block-view-empty'
export const PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'pricing-block-view-unresolved'

export const PricingBlockView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { entities, onPricingCommand } = useRichTextEditorContext()

  const pricingType = (node.attrs.pricingType ?? 'plan') as PricingType
  const entityIds = (node.attrs.entityIds ?? []) as string[]
  const isEmpty = entityIds.length === 0

  const resolvedEntities = entityIds
    .map((id) => entities[id])
    .filter(Boolean)
  const hasResolved = resolvedEntities.length > 0

  const handleClick = () => {
    onPricingCommand?.({
      onSave: (attrs, _entityData) => {
        updateAttributes(attrs)
      },
      editData: isEmpty ? undefined : { pricingType, entityIds },
    })
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper className="spacer" data-type="pricingBlock">
        <div className="block-wrapper">
          <button
            className={`pricing-block pricing-block--empty ${selected ? 'pricing-block--selected' : ''}`}
            onClick={handleClick}
            tabIndex={0}
            data-test={PRICING_BLOCK_VIEW_EMPTY_TEST_ID}
          >
            <span className="pricing-block__placeholder">Select pricing</span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  if (hasResolved) {
    const displayText =
      pricingType === 'plan'
        ? `${resolvedEntities[0].name} (${resolvedEntities[0].code})`
        : resolvedEntities.map((e) => e.name).join(', ')

    return (
      <NodeViewWrapper className="spacer" data-type="pricingBlock">
        <div className="block-wrapper">
          <button
            className={`pricing-block pricing-block--clickable ${selected ? 'pricing-block--selected' : ''}`}
            onClick={handleClick}
            data-test={PRICING_BLOCK_VIEW_TEST_ID}
          >
            <span>{displayText}</span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  // Unresolved state: entityIds present but no matching entity data in context
  const fallbackText =
    pricingType === 'plan'
      ? `Plan: ${entityIds[0]}`
      : `Add-ons: ${entityIds.join(', ')}`

  return (
    <NodeViewWrapper className="spacer" data-type="pricingBlock">
      <div className="block-wrapper">
        <div
          className={`pricing-block ${selected ? 'pricing-block--selected' : ''}`}
          data-test={PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID}
        >
          <div className="pricing-block__unresolved">
            <span>{fallbackText}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
