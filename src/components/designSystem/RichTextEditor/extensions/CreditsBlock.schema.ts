import { mergeAttributes, Node } from '@tiptap/core'

import type { EntityData } from '../common/RichTextEditorContext'
import { wrapInBlockWrapper } from '../extensions/BlockWrapper'

export interface CreditsBlockAttributes {
  localId: string
}

export const CreditsBlockSchema = Node.create({
  name: 'creditsBlock',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      entities: {} as Record<string, EntityData>,
    }
  },

  addAttributes() {
    return {
      localId: {
        default: '',
        parseHTML: (element: HTMLElement) => element.dataset.localId ?? '',
      },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
          node: { attrs: CreditsBlockAttributes },
        ) {
          state.write(`<!-- entity:credits:${node.attrs.localId} -->`)
          state.closeBlock(node)
        },
        parse: {
          updateDOM(element: HTMLElement) {
            element.innerHTML = element.innerHTML.replaceAll(
              /<!--\s*entity:credits:([\s\S]*?)-->/g,
              (_match: string, raw: string) => {
                const localId = raw.trim()

                return `<div data-type="credits-block" data-local-id="${localId}"></div>`
              },
            )
          },
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="credits-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const localId: string = HTMLAttributes.localId ?? ''

    const wrapperAttrs = mergeAttributes(HTMLAttributes, {
      'data-type': 'credits-block',
      'data-local-id': localId,
      class: 'pricing-block',
    })

    const resolvedEntities: Record<string, EntityData> = this.options.entities ?? {}
    const entity = resolvedEntities[localId]
    const label = entity?.name || 'Select credits'

    return wrapInBlockWrapper('creditsBlock', [
      'div',
      wrapperAttrs,
      ['span', { class: 'pricing-block__label' }, label],
    ])
  },
})
