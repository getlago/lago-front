import { ReactNodeViewRenderer } from '@tiptap/react'

import { PlanBlockSchema } from './PlanBlock.schema'

import { PlanBlockView } from '../PlanBlock/PlanBlockView'

export type { PlanBlockAttributes } from './PlanBlock.schema'

export const PlanBlock = PlanBlockSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(PlanBlockView)
  },
})
