import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { Icon } from 'lago-design-system'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { Locale, LocaleEnum } from '~/core/translations'
import { CurrencyEnum } from '~/generated/graphql'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { OneOffAddOnsPreviewTable } from './OneOffAddOnsPreviewTable'

import { useRichTextEditorContext } from '../common/RichTextEditorContext'
import { PricingType } from '../extensions/PricingBlock.schema'

export const PRICING_BLOCK_VIEW_TEST_ID = 'pricing-block-view'
export const PRICING_BLOCK_VIEW_EMPTY_TEST_ID = 'pricing-block-view-empty'
export const PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'pricing-block-view-unresolved'

export const PricingBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const { entities, onPricingCommand, mode, customerLocale } = useRichTextEditorContext()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const currency = organization?.defaultCurrency ?? CurrencyEnum.Usd

  const effectiveLocale: Locale = (customerLocale ?? 'en') as Locale
  const { translateWithContextualLocal } = useContextualLocale(effectiveLocale)

  const pricingType = (node.attrs.pricingType ?? 'plan') as PricingType
  const entityIds = (node.attrs.entityIds ?? []) as string[]
  const isEmpty = entityIds.length === 0

  const resolvedEntities = entityIds.map((id) => entities[id]).filter(Boolean)
  const hasResolved = resolvedEntities.length > 0

  // Preview mode: dispatch by pricing type
  if (mode === 'preview' && hasResolved) {
    if (pricingType === 'addOns') {
      return (
        <NodeViewWrapper className="spacer" data-type="pricingBlock">
          <OneOffAddOnsPreviewTable
            entities={resolvedEntities}
            translate={translateWithContextualLocal}
            currency={currency}
            locale={LocaleEnum[effectiveLocale]}
          />
        </NodeViewWrapper>
      )
    }

    // Plan preview — fall through to existing resolved rendering for now
  }

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
            onMouseDown={(e) => e.stopPropagation()}
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
              onMouseDown={(e) => e.stopPropagation()}
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
        <div className="pricing-block" data-test={PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID}>
          <div className="pricing-block__unresolved">
            <span>{fallbackText}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
