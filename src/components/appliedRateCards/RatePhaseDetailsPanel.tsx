import { ReactNode } from 'react'
import { generatePath } from 'react-router'

import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { Typography } from '~/components/designSystem/Typography'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { getFirstPathSegment } from '~/core/router/utils/getFirstPathSegment'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'
import { RateDetailsWrapperSwitch } from '~/pages/catalog/rateProperties/RateDetailsWrapperSwitch'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import { tw } from '~/styles/utils'

import { OverrideDiffField } from './overrideDiff'
import {
  formatIntervalDuration,
  formatPhaseTimeline,
  RatePhaseForDetails,
  RatePhaseRate,
} from './ratePhaseDisplay'

export const RATE_PHASE_DETAILS_PANEL_TEST_ID = 'rate-phase-details-panel'
export const RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID = 'rate-phase-details-overridden'
export const RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID = 'rate-phase-details-spending-minimum'
export const RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID = 'rate-phase-details-rate-history-link'

type RatePhaseDetailsPanelProps = {
  phase: RatePhaseForDetails
  phaseRate: RatePhaseRate | null
  rateCardId: string
  rateCard: {
    currency: CurrencyEnum
    billingTiming: RateCardBillingTimingEnum
    appliedPricingUnitCode?: string | null
  }
}

const OVERRIDDEN_VALUE_CLASSNAME = 'w-fit bg-purple-100'

const DetailItem = ({
  label,
  value,
  isOverridden = false,
}: {
  label: string
  value: ReactNode
  isOverridden?: boolean
}): JSX.Element => (
  <div className="flex min-w-0 flex-col">
    <Typography variant="captionHl" color="grey600">
      {label}
    </Typography>
    <Typography
      variant="body"
      color="grey700"
      className={tw(isOverridden && OVERRIDDEN_VALUE_CLASSNAME)}
      data-test={isOverridden ? RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID : undefined}
    >
      {value}
    </Typography>
  </div>
)

const DetailsSection = ({ title, children }: { title: string; children: ReactNode }) => (
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
  rateCardId,
  rateCard,
}: RatePhaseDetailsPanelProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { pricingUnits } = useCustomPricingUnits()
  const pricingUnit = pricingUnits.find((unit) => unit.code === rateCard.appliedPricingUnitCode)
  const rate = phaseRate?.rate
  const overriddenFields: Set<OverrideDiffField> = phaseRate?.isOverridden
    ? phaseRate.overriddenFields
    : new Set()

  const formatAmount = (amount: number): string =>
    intlFormatNumber(amount, {
      currencyDisplay: 'symbol',
      currency: rateCard.currency,
      maximumFractionDigits: 15,
    })

  // Drawers render outside the router, so no `useParams`: the org slug is read from the URL.
  const rateHistoryPath = prependOrgSlug(
    generatePath(RATE_CARD_DETAILS_ROUTE, {
      rateCardId,
      tab: RateCardDetailsTabsOptionsEnum.rates,
    }),
    getFirstPathSegment(window.location.pathname),
  )

  const renderRateSection = (): ReactNode => {
    if (!phaseRate || !rate) return null

    const isTiered = isTieredRateModel(rate.rateModel)
    const minAmountCents = Number(rate.minAmountCents ?? 0)
    // Expressed in the pricing unit when the card has one, as on the catalog rate details.
    const spendingMinimum =
      minAmountCents > 0
        ? intlFormatNumber(deserializeAmount(minAmountCents, rateCard.currency), {
            currencyDisplay: 'symbol',
            currency: rateCard.currency,
            pricingUnitShortName:
              pricingUnit?.shortName ?? rateCard.appliedPricingUnitCode ?? undefined,
            maximumFractionDigits: 15,
          })
        : '-'

    return (
      <DetailsSection title={translate('text_64de472463e2da6b31737de0')}>
        {!phaseRate.isOverridden && (
          <DetailItem
            label={translate('text_1791838459984railij85x3f')}
            value={
              <span className="flex items-center gap-2">
                {intlFormatDateTime(phaseRate.effectiveFrom, { timezone: TimezoneEnum.TzUtc }).date}
                <ButtonLink
                  type="button"
                  external
                  to={rateHistoryPath}
                  buttonProps={{ variant: 'inline', endIcon: 'outside' }}
                  data-test={RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID}
                >
                  {translate('text_1791838459984rqckim3pm28')}
                </ButtonLink>
              </span>
            }
          />
        )}

        <div className="grid grid-cols-2 gap-8">
          <DetailItem
            label={translate('text_1787737220227tqziocrcywv')}
            value={translate('text_17918384599832tqq2f0ezu9', {
              duration: formatIntervalDuration(
                rate.billingIntervalCount ?? 1,
                rate.billingIntervalUnit ?? RateCardRateBillingIntervalUnitEnum.Month,
                translate,
              ),
            })}
            isOverridden={
              overriddenFields.has('billingIntervalCount') ||
              overriddenFields.has('billingIntervalUnit')
            }
          />
          {!!rateCard.appliedPricingUnitCode && (
            <DetailItem
              label={translate('text_1750411499858su5b7bbp5t9')}
              value={translate('text_1791838459984mz627wmmt51', {
                pricingUnitName: pricingUnit?.name ?? rateCard.appliedPricingUnitCode,
                pricingUnitShortName: pricingUnit?.shortName ?? rateCard.appliedPricingUnitCode,
                amount: formatAmount(Number(rate.pricingUnitConversionRate ?? 0)),
              })}
              isOverridden={overriddenFields.has('pricingUnitConversionRate')}
            />
          )}
        </div>

        <DetailItem
          label={translate('text_65201b8216455901fe273dd5')}
          value={translate(chargeModelLookupTranslation[toChargeModel(rate.rateModel)])}
          isOverridden={overriddenFields.has('rateModel')}
        />

        <div
          className={tw(
            overriddenFields.has('rateProperties') &&
              (isTiered
                ? '[&_tbody_td:not(:first-child)>*]:w-fit [&_tbody_td:not(:first-child)>*]:bg-purple-100'
                : '[&_tbody_td>*]:w-fit [&_tbody_td>*]:bg-purple-100'),
          )}
        >
          <RateDetailsWrapperSwitch
            rateModel={rate.rateModel}
            rateProperties={rate.rateProperties}
            currency={rateCard.currency}
            pricingUnitShortName={pricingUnit?.shortName}
          />
        </div>

        {rateCard.billingTiming === RateCardBillingTimingEnum.Arrears && (
          <DetailItem
            label={translate('text_1791838459984ploipjejyo9')}
            value={
              <span data-test={RATE_PHASE_DETAILS_SPENDING_MINIMUM_TEST_ID}>{spendingMinimum}</span>
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
          <DetailItem
            label={translate('text_629728388c4d2300e2d38091')}
            value={phase.name || '-'}
          />
          <DetailItem label={translate('text_629728388c4d2300e2d380b7')} value={phase.code} />
        </div>
        <DetailItem label={translate('text_1791835259929vzy9i811ojq')} value={phase.position} />
        <DetailItem
          label={translate('text_17914856703265q2q10b1hry')}
          value={formatPhaseTimeline(phase, rate, translate)}
        />
      </DetailsSection>

      {renderRateSection()}
    </div>
  )
}
