import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { CurrencyEnum, RateCardBillingTimingEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'

import { OverrideDiffField } from './overrideDiff'
import { RatePhaseDetailItem } from './RatePhaseDetailItem'
import {
  formatConversionRateAmount,
  formatPhaseTimeline,
  formatRateBillingInterval,
  formatSpendingMinimum,
  RatePhaseForDetails,
  RatePhaseRate,
} from './ratePhaseDisplay'
import { RatePhaseRateEffectiveDate } from './RatePhaseRateEffectiveDate'
import { RatePhaseRateProperties } from './RatePhaseRateProperties'

export const RATE_PHASE_DETAILS_PANEL_TEST_ID = 'rate-phase-details-panel'
export const RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID = 'rate-phase-details-spending-minimum'
export const RATE_PHASE_DETAILS_CONVERSION_RATE_TEST_ID = 'rate-phase-details-conversion-rate'

type RatePhaseDetailsPanelProps = {
  phase: RatePhaseForDetails
  phaseRate: RatePhaseRate | null
  rateHistoryPath: string
  rateCard: {
    currency: CurrencyEnum
    billingTiming: RateCardBillingTimingEnum
    appliedPricingUnitCode?: string | null
  }
}

const DetailsSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): JSX.Element => (
  <section className="flex flex-col gap-4 py-4 pl-10 pr-1 shadow-b">
    <Typography variant="bodyHl" color="grey700">
      {title}
    </Typography>
    {children}
  </section>
)

export const RatePhaseDetailsPanel = ({
  phase,
  phaseRate,
  rateHistoryPath,
  rateCard,
}: RatePhaseDetailsPanelProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { pricingUnits } = useCustomPricingUnits()
  const pricingUnit = pricingUnits.find((unit) => unit.code === rateCard.appliedPricingUnitCode)
  const pricingUnitShortName =
    pricingUnit?.shortName ?? rateCard.appliedPricingUnitCode ?? undefined
  const rate = phaseRate?.rate
  const overriddenFields: Set<OverrideDiffField> = phaseRate?.isOverridden
    ? phaseRate.overriddenFields
    : new Set()

  const renderRateSection = (): ReactNode => {
    if (!phaseRate || !rate) return null

    return (
      <DetailsSection title={translate('text_64de472463e2da6b31737de0')}>
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

        <div className="grid grid-cols-2 gap-8">
          <RatePhaseDetailItem
            label={translate('text_1787737220227tqziocrcywv')}
            value={formatRateBillingInterval(rate, translate)}
            isOverridden={
              overriddenFields.has('billingIntervalCount') ||
              overriddenFields.has('billingIntervalUnit')
            }
          />
          {!!rateCard.appliedPricingUnitCode && (
            <RatePhaseDetailItem
              label={translate('text_1750411499858su5b7bbp5t9')}
              value={
                <span data-test={RATE_PHASE_DETAILS_CONVERSION_RATE_TEST_ID}>
                  {translate('text_1791838459984mz627wmmt51', {
                    pricingUnitName: pricingUnit?.name ?? rateCard.appliedPricingUnitCode,
                    pricingUnitShortName,
                    amount: formatConversionRateAmount(
                      Number(rate.pricingUnitConversionRate ?? 0),
                      rateCard.currency,
                    ),
                  })}
                </span>
              }
              isOverridden={overriddenFields.has('pricingUnitConversionRate')}
            />
          )}
        </div>

        <RatePhaseDetailItem
          label={translate('text_65201b8216455901fe273dd5')}
          value={translate(chargeModelLookupTranslation[toChargeModel(rate.rateModel)])}
          isOverridden={overriddenFields.has('rateModel')}
        />

        <RatePhaseRateProperties
          rate={rate}
          currency={rateCard.currency}
          pricingUnitShortName={pricingUnit?.shortName}
          isOverridden={overriddenFields.has('rateProperties')}
        />

        {rateCard.billingTiming === RateCardBillingTimingEnum.Arrears && (
          <RatePhaseDetailItem
            label={translate('text_1791838459984ploipjejyo9')}
            value={
              <span data-test={RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID}>
                {formatSpendingMinimum(rate, rateCard.currency, pricingUnitShortName)}
              </span>
            }
            isOverridden={overriddenFields.has('minAmountCents')}
          />
        )}
      </DetailsSection>
    )
  }

  return (
    <div className="flex flex-col" data-test={RATE_PHASE_DETAILS_PANEL_TEST_ID}>
      <DetailsSection title={translate('text_17918352599291fjtlpy6o9t')}>
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
          value={formatPhaseTimeline(phase, rate, translate)}
        />
      </DetailsSection>

      {renderRateSection()}
    </div>
  )
}
