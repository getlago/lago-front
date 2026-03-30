import { mergeAttributes, Node } from '@tiptap/core'

import type { EntityData } from '../RichTextEditorContext'

export interface PlanBlockAttributes {
  planId: string
}

export interface PlanBlockPreviewData {
  nameHeader: string
  codeHeader: string
  nameValue: string
  codeValue: string
}

export const getPlanBlockPreviewData = (
  planId: string,
  plan?: { name?: string; code?: string },
): PlanBlockPreviewData => ({
  nameHeader: plan?.name ? 'Plan name' : 'Plan ID',
  codeHeader: plan?.code ? 'Plan code' : 'Plan ID',
  nameValue: plan?.name ?? planId,
  codeValue: plan?.code ?? planId,
})

export const PlanBlockSchema = Node.create({
  name: 'planBlock',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      plans: {} as Record<string, EntityData>,
    }
  },

  addAttributes() {
    return {
      planId: {
        default: '',
        parseHTML: (element) => element.dataset.planId ?? '',
      },
    }
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
    const plan = this.options.plans?.[planId]

    const wrapperAttrs = mergeAttributes(HTMLAttributes, {
      'data-type': 'plan-block',
      'data-plan-id': planId,
      class: 'plan-block',
    })

    if (plan) {
      const preview = getPlanBlockPreviewData(planId, plan)

      return [
        'div',
        wrapperAttrs,
        [
          'table',
          { class: 'plan-block__table' },
          ['thead', {}, ['tr', {}, ['th', {}, preview.nameHeader], ['th', {}, preview.codeHeader]]],
          ['tbody', {}, ['tr', {}, ['td', {}, preview.nameValue], ['td', {}, preview.codeValue]]],
        ],
      ]
    }

    return [
      'div',
      wrapperAttrs,
      ['span', { class: 'plan-block__label' }, planId ? `Plan: ${planId}` : 'Select a plan'],
    ]
  },
})
