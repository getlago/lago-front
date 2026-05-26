import { mergeAttributes, Node } from '@tiptap/core'

import type { EntityData } from '../common/RichTextEditorContext'
import { wrapInBlockWrapper } from '../extensions/BlockWrapper'

export type PricingType = 'plan' | 'addOns'

export interface PricingBlockAttributes {
  pricingType: PricingType
  entityIds: string[]
}

export interface PricingBlockPreviewRow {
  nameValue: string
  codeValue: string
}

export interface PricingBlockPreviewData {
  nameHeader: string
  codeHeader: string
  rows: PricingBlockPreviewRow[]
}

const LABELS: Record<PricingType, { name: string; code: string; id: string; select: string }> = {
  plan: { name: 'Plan name', code: 'Plan code', id: 'Plan ID', select: 'Select a plan' },
  addOns: {
    name: 'Add-on name',
    code: 'Add-on code',
    id: 'Add-on ID',
    select: 'Select add-ons',
  },
}

export const getPricingBlockPreviewData = (
  pricingType: PricingType,
  entityIds: string[],
  entities?: Record<string, { name?: string; code?: string }>,
): PricingBlockPreviewData => {
  const labels = LABELS[pricingType]

  if (entityIds.length === 0) {
    return {
      nameHeader: labels.name,
      codeHeader: labels.code,
      rows: [],
    }
  }

  const hasAnyResolved = entityIds.some((id) => entities?.[id]?.name || entities?.[id]?.code)

  return {
    nameHeader: hasAnyResolved ? labels.name : labels.id,
    codeHeader: hasAnyResolved ? labels.code : labels.id,
    rows: entityIds.map((id) => {
      const entity = entities?.[id]

      return {
        nameValue: entity?.name ?? id,
        codeValue: entity?.code ?? id,
      }
    }),
  }
}

export const PricingBlockSchema = Node.create({
  name: 'pricingBlock',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      entities: {} as Record<string, EntityData>,
    }
  },

  addAttributes() {
    return {
      pricingType: {
        default: 'plan' as PricingType,
        parseHTML: (element: HTMLElement) => (element.dataset.pricingType as PricingType) ?? 'plan',
      },
      entityIds: {
        default: [] as string[],
        parseHTML: (element: HTMLElement) => {
          const raw = element.dataset.entityIds

          if (!raw) return []

          return raw.split(',').filter(Boolean)
        },
      },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
          node: { attrs: PricingBlockAttributes },
        ) {
          const { pricingType, entityIds } = node.attrs
          const idsStr = entityIds.join(',')

          state.write(`<!-- entity:pricing:${pricingType}:${idsStr} -->`)
          state.closeBlock(node)
        },
        parse: {
          updateDOM(element: HTMLElement) {
            element.innerHTML = element.innerHTML.replaceAll(
              /<!--\s*entity:pricing:(plan|addOns):(.*?)\s*-->/g,
              (_match: string, pricingType: string, entityIds: string) =>
                `<div data-type="pricing-block" data-pricing-type="${pricingType}" data-entity-ids="${entityIds}"></div>`,
            )
          },
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pricing-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const pricingType = (HTMLAttributes.pricingType ?? 'plan') as PricingType
    const entityIds: string[] = HTMLAttributes.entityIds ?? []
    const labels = LABELS[pricingType]

    const wrapperAttrs = mergeAttributes(HTMLAttributes, {
      'data-type': 'pricing-block',
      'data-pricing-type': pricingType,
      'data-entity-ids': entityIds.join(','),
      class: 'pricing-block',
    })

    // Resolve entities from options
    const resolvedEntities: Record<string, EntityData> = this.options.entities ?? {}
    const hasEntities = entityIds.some((id) => resolvedEntities[id])

    if (hasEntities && entityIds.length > 0) {
      const preview = getPricingBlockPreviewData(pricingType, entityIds, resolvedEntities)
      const bodyRows = preview.rows.map(
        (row) => ['tr', {}, ['td', {}, row.nameValue], ['td', {}, row.codeValue]] as const,
      )

      return wrapInBlockWrapper('pricingBlock', [
        'div',
        wrapperAttrs,
        [
          'table',
          { class: 'pricing-block__table' },
          ['thead', {}, ['tr', {}, ['th', {}, preview.nameHeader], ['th', {}, preview.codeHeader]]],
          ['tbody', {}, ...bodyRows],
        ],
      ])
    }

    // Fallback label
    let fallbackLabel: string

    if (entityIds.length === 0) {
      fallbackLabel = labels.select
    } else if (pricingType === 'plan') {
      fallbackLabel = `Plan: ${entityIds[0]}`
    } else {
      fallbackLabel = `Add-ons: ${entityIds.join(', ')}`
    }

    return wrapInBlockWrapper('pricingBlock', [
      'div',
      wrapperAttrs,
      ['span', { class: 'pricing-block__label' }, fallbackLabel],
    ])
  },
})
