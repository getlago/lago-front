import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import SlashCommandBlockWrapper from '../SlashCommandBlockWrapper/SlashCommandBlockWrapper'

export const DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID = 'discount-block-view-empty'
export const DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'discount-block-view-unresolved'

export const DiscountBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const { entities, onDiscountCommand } = useRichTextEditorContext()

  const couponId = (node.attrs.couponId ?? '') as string
  const localId = (node.attrs.localId ?? '') as string
  const isEmpty = couponId === ''

  const entity = entities[localId] ?? entities[couponId]

  const handleClick = () => {
    onDiscountCommand?.({
      onSave: (attrs) => updateAttributes(attrs),
      editData: isEmpty ? undefined : { couponId, localId },
    })
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper className="spacer" data-type="discountBlock">
        <div className="block-wrapper">
          <button
            className="pricing-block pricing-block--empty"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            tabIndex={0}
            data-test={DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID}
          >
            <span className="pricing-block__placeholder">Select a coupon</span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  if (entity) {
    return (
      <NodeViewWrapper className="spacer" data-type="discountBlock">
        <div className="block-wrapper">
          <SlashCommandBlockWrapper
            typeText="Discount"
            handleClick={handleClick}
            icon="coupon"
            displayText={entity.name}
          />
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="spacer" data-type="discountBlock">
      <div className="block-wrapper">
        <div className="pricing-block" data-test={DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID}>
          <div className="pricing-block__unresolved">
            <span>{`Coupon: ${couponId}`}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
