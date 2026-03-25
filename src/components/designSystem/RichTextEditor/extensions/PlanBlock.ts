import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { PlanBlockView } from '../PlanBlock/PlanBlockView'

export interface PlanBlockAttributes {
  planId: string
}

export const PlanBlock = Node.create({
  name: 'planBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      planId: {
        default: '',
        parseHTML: (element) => element.dataset.planId ?? '',
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlanBlockView)
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
          node: { attrs: PlanBlockAttributes },
        ) {
          const { planId } = node.attrs

          if (!planId) {
            state.write('<!-- entity:plan: -->')
            state.closeBlock(node)
            return
          }

          state.write(`<!-- entity:plan:${planId} -->`)
          state.closeBlock(node)
        },
        parse: {
          updateDOM(element: HTMLElement) {
            element.innerHTML = element.innerHTML.replaceAll(
              /<!--\s*entity:plan:(\S*?)\s*-->/g,
              (_match: string, planId: string) =>
                `<div data-type="plan-block" data-plan-id="${planId}"></div>`,
            )
          },
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="plan-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const planId = String(HTMLAttributes.planId ?? '')

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'plan-block',
        'data-plan-id': planId,
        class: 'plan-block',
      }),
      ['span', { class: 'plan-block__label' }, planId ? `Plan: ${planId}` : 'Select a plan'],
    ]
  },
})
