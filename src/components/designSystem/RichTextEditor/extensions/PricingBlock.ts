import { ReactNodeViewRenderer } from '@tiptap/react'

import { PricingBlockSchema } from './PricingBlock.schema'

import { PricingBlockView } from '../PricingBlock/PricingBlockView'

export type { PricingBlockAttributes } from './PricingBlock.schema'

export const PricingBlock = PricingBlockSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(PricingBlockView)
  },
})
