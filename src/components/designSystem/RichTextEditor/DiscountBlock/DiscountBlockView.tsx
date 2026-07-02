import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CouponFrequency, CouponTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { type EntityData, useRichTextEditorContext } from '../common/RichTextEditorContext'
import SlashCommandBlockWrapper from '../SlashCommandBlockWrapper/SlashCommandBlockWrapper'

export const DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID = 'discount-block-view-empty'
export const DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'discount-block-view-unresolved'

// Preview-mode rendering: minimal read-only display (no chevron, no click handler).
// NOTE: this layout is a best-effort default — no Figma design exists yet;
// confirm copy/layout with design before shipping to customers.
const DiscountBlockPreview = ({ entity }: { entity: EntityData }) => {
  const { translate } = useInternationalization()

  const getFrequencyKey = () => {
    if (entity.frequency === CouponFrequency.Once) {
      return 'text_632d68358f1fedc68eed3ea3'
    }

    if (entity.frequency === CouponFrequency.Recurring) {
      return 'text_632d68358f1fedc68eed3e64'
    }

    return 'text_63c83a3476e46bc6ab9d85d6'
  }

  const frequencyLabel = translate(getFrequencyKey())

  let valueLabel = ''

  if (
    entity.couponType === CouponTypeEnum.FixedAmount &&
    entity.amountCents &&
    entity.amountCurrency
  ) {
    valueLabel = intlFormatNumber(deserializeAmount(entity.amountCents, entity.amountCurrency), {
      currency: entity.amountCurrency,
    })
  } else if (entity.couponType === CouponTypeEnum.Percentage && entity.percentageRate !== null) {
    valueLabel = `${entity.percentageRate}%`
  }

  const caption = valueLabel ? `${valueLabel} • ${frequencyLabel}` : frequencyLabel

  return (
    <NodeViewWrapper className="spacer" data-type="discountBlock">
      <div className="block-wrapper">
        <div className="pricing-block">
          <div className="pricing-block-content">
            <div className="pricing-block-text">
              <Typography variant="bodyHl" color="grey700">
                {entity.name}
              </Typography>
              <Typography variant="caption">{caption}</Typography>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const DiscountBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const { entities, onDiscountCommand, mode } = useRichTextEditorContext()
  const { translate } = useInternationalization()

  const couponId = (node.attrs.couponId ?? '') as string
  const localId = (node.attrs.localId ?? '') as string
  const isEmpty = couponId === ''

  const entity = (localId && entities[localId]) || (couponId && entities[couponId]) || undefined

  // Preview mode: read-only, non-interactive
  if (mode === 'preview') {
    if (entity) {
      return <DiscountBlockPreview entity={entity} />
    }

    // Empty or unresolved in preview — render nothing interactive
    return <NodeViewWrapper className="spacer" data-type="discountBlock" />
  }

  const handleClick = () => {
    onDiscountCommand?.({
      onSave: (attrs) => updateAttributes(attrs),
      editData: isEmpty ? undefined : { couponId, localId },
    })
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper className="spacer" data-type="discountBlock">
        <div className="block-wrapper">
          <button
            className="pricing-block pricing-block--empty"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            tabIndex={0}
            data-test={DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID}
          >
            <span className="pricing-block__placeholder">Select a coupon</span>
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  if (entity) {
    return (
      <NodeViewWrapper className="spacer" data-type="discountBlock">
        <div className="block-wrapper">
          <SlashCommandBlockWrapper
            typeText={translate('text_1782889379261hdcd0jhzdm6')}
            handleClick={handleClick}
            icon="coupon"
            displayText={entity.name}
          />
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="spacer" data-type="discountBlock">
      <div className="block-wrapper">
        <div className="pricing-block" data-test={DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID}>
          <div className="pricing-block__unresolved">
            <span>{`Coupon: ${couponId}`}</span>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
