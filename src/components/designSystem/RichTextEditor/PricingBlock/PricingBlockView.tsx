import { NodeViewWrapper } from '@tiptap/react'

export const PRICING_BLOCK_VIEW_TEST_ID = 'pricing-block-view'

export const PricingBlockView = () => {
  return (
    <NodeViewWrapper className="spacer" data-type="pricingBlock">
      <div className="block-wrapper">
        <div data-test={PRICING_BLOCK_VIEW_TEST_ID}>stub</div>
      </div>
    </NodeViewWrapper>
  )
}
