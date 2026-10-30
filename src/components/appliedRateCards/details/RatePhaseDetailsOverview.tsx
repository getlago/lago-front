import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { OverrideDiffField } from '~/components/appliedRateCards/overrideDiff'
import { RatePhaseDetailItem } from '~/components/appliedRateCards/RatePhaseDetailItem'
import {
  formatConversionRateAmount,
  formatPhaseTimeline,
  formatRateBillingInterval,
  formatSpendingMinimum,
  RatePhaseRate,
} from '~/components/appliedRateCards/ratePhaseDisplay'
import {
  getServerPhaseRate,
  toServerPhaseForDetails,
} from '~/components/appliedRateCards/ratePhaseRate'
import { RatePhaseRateChip } from '~/components/appliedRateCards/RatePhaseRateChip'
import { RatePhaseRateEffectiveDate } from '~/components/appliedRateCards/RatePhaseRateEffectiveDate'
import { RatePhaseRateProperties } from '~/components/appliedRateCards/RatePhaseRateProperties'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { RateCardBillingTimingEnum, RatePhaseForDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'

import { RatePhaseSectionAction } from './useRatePhaseActions'

export const RATE_PHASE_OVERVIEW_TEST_ID = 'rate-phase-overview'
export const RATE_PHASE_OVERVIEW_EDIT_TEST_ID = 'rate-phase-overview-edit'
export const RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID = 'rate-phase-overview-rate-section'
export const RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID = 'rate-phase-overview-see-active-rate'
export const RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID = 'rate-phase-overview-pricing-unit'
export const RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID = 'rate-phase-overview-conversion-rate'
export const RATE_PHASE_OVERVIEW_MIN_SPENDING_TEST_ID = 'rate-phase-overview-min-spending'

type RatePhaseDetailsOverviewProps = {
  phase: RatePhaseForDrawerFragment
  rateCard: RateCardForRatePhaseFields | undefined
  rateHistoryPath: string
  editPhase: RatePhaseSectionAction
}

type RatePhaseOverviewRateProps = {
  phaseRate: RatePhaseRate
  rateCard: RateCardForRatePhaseFields
  rateHistoryPath: string
}

const RatePhaseOverviewRate = ({
  phaseRate,
  rateCard,
  rateHistoryPath,
}: RatePhaseOverviewRateProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { pricingUnits } = useCustomPricingUnits()
  const { rate } = phaseRate
  const pricingUnitCode = rateCard.appliedPricingUnitCode
  const pricingUnit = pricingUnits.find((unit) => unit.code === pricingUnitCode)
  const pricingUnitShortName = pricingUnit?.shortName ?? pricingUnitCode ?? undefined
  const overriddenFields: Set<OverrideDiffField> = phaseRate.isOverridden
    ? phaseRate.overriddenFields
    : new Set()

  return (
    <div className="flex flex-col gap-6" data-test={RATE_PHASE_OVERVIEW_RATE_SECTION_TEST_ID}>
      <RatePhaseDetailItem
        label={translate('text_64de472463e2da6b31737de0')}
        value={
          <div className="flex items-center gap-3">
            <RatePhaseRateChip isOverridden={phaseRate.isOverridden} labelLength="long" />
            {phaseRate.isOverridden && !!rateCard.activeRate && (
              <ButtonLink
                type="button"
                external
                to={rateHistoryPath}
                buttonProps={{ variant: 'inline', endIcon: 'outside' }}
                data-test={RATE_PHASE_OVERVIEW_SEE_ACTIVE_RATE_TEST_ID}
              >
                {translate('text_1792806558676u8zmm1cjcpk')}
              </ButtonLink>
            )}
          </div>
        }
      />

      {!phaseRate.isOverridden && (
        <RatePhaseDetailItem
          label={translate('text_1791838459984railij85x3f')}
          value={
            <RatePhaseRateEffectiveDate
              effectiveFrom={phaseRate.effectiveFrom}
              rateHistoryPath={rateHistoryPath}
            />
          }
        />
      )}

      <RatePhaseDetailItem
        label={translate('text_1787737220227tqziocrcywv')}
        value={formatRateBillingInterval(rate, translate)}
        isOverridden={
          overriddenFields.has('billingIntervalCount') ||
          overriddenFields.has('billingIntervalUnit')
        }
      />

      {!!pricingUnitCode && (
        <div className="grid grid-cols-2 gap-8">
          <RatePhaseDetailItem
            label={translate('text_17502505476284yyq70yy6mx')}
            value={
              <span data-test={RATE_PHASE_OVERVIEW_PRICING_UNIT_TEST_ID}>
                {pricingUnit?.name ?? pricingUnitCode}
              </span>
            }
          />
          <RatePhaseDetailItem
            label={translate('text_1750411499858su5b7bbp5t9')}
            value={
              <span data-test={RATE_PHASE_OVERVIEW_CONVERSION_RATE_TEST_ID}>
                {translate('text_1750424999815sw5whlu1xj0', {
                  shortName: pricingUnitShortName,
                  conversionRateAmount: formatConversionRateAmount(
                    Number(rate.pricingUnitConversionRate ?? 0),
                    rateCard.currency,
                  ),
                })}
              </span>
            }
            isOverridden={overriddenFields.has('pricingUnitConversionRate')}
          />
        </div>
      )}

      <RatePhaseDetailItem
        label={translate('text_17928065586762rndb8ev72x')}
        value={translate(chargeModelLookupTranslation[toChargeModel(rate.rateModel)])}
        isOverridden={overriddenFields.has('rateModel')}
      />

      <RatePhaseRateProperties
        rate={rate}
        currency={rateCard.currency}
        pricingUnitShortName={pricingUnitShortName}
        isOverridden={overriddenFields.has('rateProperties')}
      />

      {rateCard.billingTiming === RateCardBillingTimingEnum.Arrears && (
        <RatePhaseDetailItem
          label={translate('text_1791838459984ploipjejyo9')}
          value={
            <span data-test={RATE_PHASE_OVERVIEW_MIN_SPENDING_TEST_ID}>
              {formatSpendingMinimum(rate, rateCard.currency, pricingUnitShortName)}
            </span>
          }
          isOverridden={overriddenFields.has('minAmountCents')}
        />
      )}
    </div>
  )
}

export const RatePhaseDetailsOverview = ({
  phase,
  rateCard,
  rateHistoryPath,
  editPhase,
}: RatePhaseDetailsOverviewProps): JSX.Element => {
  const { translate } = useInternationalization()
  const phaseRate = rateCard ? getServerPhaseRate(phase, rateCard) : null

  return (
    <section className="flex flex-col gap-6" data-test={RATE_PHASE_OVERVIEW_TEST_ID}>
      <SectionHeader
        title={translate('text_1792806558676l30cozysvz1')}
        description={translate('text_1791833366840e0avdoxeza9')}
        contentClassName="gap-2"
        action={{
          label: translate('text_1791485670326gf0h0n6l1w7'),
          dataTest: RATE_PHASE_OVERVIEW_EDIT_TEST_ID,
          hidden: editPhase.hidden,
          disabled: editPhase.disabled,
          onClick: editPhase.open,
        }}
      />

      <div className="grid grid-cols-2 gap-8">
        <RatePhaseDetailItem
          label={translate('text_629728388c4d2300e2d38091')}
          value={phase.name || '-'}
        />
        <RatePhaseDetailItem
          label={translate('text_629728388c4d2300e2d380b7')}
          value={phase.code}
        />
      </div>

      <RatePhaseDetailItem
        label={translate('text_1791835259929vzy9i811ojq')}
        value={phase.position}
      />

      <RatePhaseDetailItem
        label={translate('text_17914856703265q2q10b1hry')}
        value={formatPhaseTimeline(toServerPhaseForDetails(phase), phaseRate?.rate, translate)}
      />

      {!!rateCard && !!phaseRate && (
        <RatePhaseOverviewRate
          phaseRate={phaseRate}
          rateCard={rateCard}
          rateHistoryPath={rateHistoryPath}
        />
      )}
    </section>
  )
}
