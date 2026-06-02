import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { Icon } from 'lago-design-system'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import { PricingType } from '../extensions/PricingBlock.schema'

export const PRICING_BLOCK_VIEW_TEST_ID = 'pricing-block-view'
export const PRICING_BLOCK_VIEW_EMPTY_TEST_ID = 'pricing-block-view-empty'
export const PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'pricing-block-view-unresolved'

export const PricingBlockView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { entities, onPricingCommand } = useRichTextEditorContext()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const currency = organization?.defaultCurrency ?? CurrencyEnum.Usd

  const pricingType = (node.attrs.pricingType ?? 'plan') as PricingType
  const entityIds = (node.attrs.entityIds ?? []) as string[]
  const isEmpty = entityIds.length === 0

  const resolvedEntities = entityIds.map((id) => entities[id]).filter(Boolean)
  const hasResolved = resolvedEntities.length > 0

  const handleClick = () => {
    onPricingCommand?.({
      onSave: (attrs) => {
        updateAttributes(attrs)
      },
      editData: isEmpty ? undefined : { pricingType, entityIds },
    })
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper className="spacer" data-type="pricingBlock">
        <div className="block-wrapper">
          <button
            className="pricing-block pricing-block--empty"
            onClick={handleClick}
            tabIndex={0}
            data-test={PRICING_BLOCK_VIEW_EMPTY_TEST_ID}
          >
            <span className="pricing-block__placeholder">Select pricing</span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  if (hasResolved) {
    const displayText =
      pricingType === 'plan'
        ? `${resolvedEntities[0].name} (${resolvedEntities[0].code})`
        : translate('text_17803276502818bsd9sn8888', {
            subtotal: intlFormatNumber(
              resolvedEntities.reduce(
                (sum, entity) => sum + Number.parseFloat(entity.totalAmount ?? '0'),
                0,
              ),
              { currency },
            ),
          })

    return (
      <NodeViewWrapper className="spacer" data-type="pricingBlock">
        <div className="block-wrapper">
          <div className="block-type-wrapper">
            <div className="block-type-tag">{translate('text_1779802343219a1cl5ckvtrn')}</div>
            <button
              className="pricing-block pricing-block--clickable"
              onClick={handleClick}
              data-test={PRICING_BLOCK_VIEW_TEST_ID}
            >
              <div className="pricing-block-content">
                <div className="icon-wrapper">
                  <Icon name="document" />
                </div>
                <div className="pricing-block-text">
                  <span>{displayText}</span>
                  <span>{translate('text_1780329442633n0oe3prszsw')}</span>
                </div>
              </div>
              <div className="click-icon-wrapper">
                <Icon name="chevron-right-filled" />
              </div>
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  // Unresolved state: entityIds present but no matching entity data in context
  const fallbackText =
    pricingType === 'plan' ? `Plan: ${entityIds[0]}` : `Add-ons: ${entityIds.join(', ')}`

  return (
    <NodeViewWrapper className="spacer" data-type="pricingBlock">
      <div className="block-wrapper">
        <div
          className="pricing-block"
          data-test={PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID}
        >
          <div className="pricing-block__unresolved">
            <span>{fallbackText}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
