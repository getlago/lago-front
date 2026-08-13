import { ReactNodeViewRenderer } from '@tiptap/react'

import { DiscountBlockSchema } from './DiscountBlock.schema'

import { DiscountBlockView } from '../DiscountBlock/DiscountBlockView'

export const DiscountBlock = DiscountBlockSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(DiscountBlockView)
  },
})
