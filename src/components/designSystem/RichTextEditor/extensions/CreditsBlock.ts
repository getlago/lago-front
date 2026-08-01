import { ReactNodeViewRenderer } from '@tiptap/react'

import { CreditsBlockSchema } from './CreditsBlock.schema'

import { CreditsBlockView } from '../CreditsBlock/CreditsBlockView'

export const CreditsBlock = CreditsBlockSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CreditsBlockView)
  },
})
