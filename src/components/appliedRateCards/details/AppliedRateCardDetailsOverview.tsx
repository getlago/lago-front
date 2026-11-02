import { ReactNode } from 'react'

import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { intlFormatDateTime } from '~/core/timezone'
import { RatePhaseForDrawerFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CatalogRelationsInfoGrid } from '~/pages/catalog/details/CatalogRelationsInfoGrid'

import { AppliedRateCardPhasesTable } from './AppliedRateCardPhasesTable'
import { AppliedRateCardDetailsData } from './types'
import { RatePhaseActions } from './useRatePhaseActions'

export const APPLIED_RATE_CARD_OVERVIEW_TEST_ID = 'applied-rate-card-overview'
export const APPLIED_RATE_CARD_OVERVIEW_RELATIONS_TEST_ID = 'applied-rate-card-overview-relations'
export const APPLIED_RATE_CARD_OVERVIEW_NAME_TEST_ID = 'applied-rate-card-overview-name'
export const APPLIED_RATE_CARD_OVERVIEW_CODE_TEST_ID = 'applied-rate-card-overview-code'
export const APPLIED_RATE_CARD_OVERVIEW_UNITS_TEST_ID = 'applied-rate-card-overview-units'
export const APPLIED_RATE_CARD_OVERVIEW_EFFECTIVE_DATE_TEST_ID =
  'applied-rate-card-overview-effective-date'
export const APPLIED_RATE_CARD_OVERVIEW_ADD_PHASE_TEST_ID = 'applied-rate-card-overview-add-phase'

type AppliedRateCardDetailsOverviewProps = {
  data: AppliedRateCardDetailsData
  rateCard: RateCardForRatePhaseFields | undefined
  createPhase: RatePhaseActions['createPhase']
  getPhaseActions: RatePhaseActions['getPhaseActions']
  getPhaseHref: (phase: RatePhaseForDrawerFragment) => string
}

type InfoGridItem = { label: string; value: ReactNode }

export const AppliedRateCardDetailsOverview = ({
  data,
  rateCard,
  createPhase,
  getPhaseActions,
  getPhaseHref,
}: AppliedRateCardDetailsOverviewProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { appliedRateCard } = data

  const getEffectiveDateItem = (): InfoGridItem | false => {
    if (data.context !== 'contract') return false

    const { date } = intlFormatDateTime(data.appliedRateCard.effectiveDate, {
      timezone: TimezoneEnum.TzUtc,
    })

    return {
      label: translate('text_1787737220227bfxpshdo133'),
      value: <span data-test={APPLIED_RATE_CARD_OVERVIEW_EFFECTIVE_DATE_TEST_ID}>{date}</span>,
    }
  }

  return (
    <div className="flex flex-col gap-12" data-test={APPLIED_RATE_CARD_OVERVIEW_TEST_ID}>
      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <SectionHeader
          title={translate('text_628cf761cbe6820138b8f2e4')}
          description={translate('text_1789030049529jp760bke0x8')}
          contentClassName="gap-2"
        />

        <div className="flex flex-col gap-4">
          <div
            className="flex flex-col gap-4"
            data-test={APPLIED_RATE_CARD_OVERVIEW_RELATIONS_TEST_ID}
          >
            <CatalogRelationsInfoGrid
              productCategory={appliedRateCard.product.productCategory}
              product={appliedRateCard.product}
              productFilter={appliedRateCard.rateCard.productFilter}
            />
          </div>

          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_1784930440656rjmo1lmed8k'),
                value: (
                  <span data-test={APPLIED_RATE_CARD_OVERVIEW_NAME_TEST_ID}>
                    {appliedRateCard.rateCard.name}
                  </span>
                ),
              },
              {
                label: translate('text_178493044065618ejwmmneyl'),
                value: (
                  <TypographyWithCopy
                    variant="body"
                    color="grey700"
                    data-test={APPLIED_RATE_CARD_OVERVIEW_CODE_TEST_ID}
                  >
                    {appliedRateCard.rateCard.code}
                  </TypographyWithCopy>
                ),
              },
            ]}
          />

          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_65771fa3f4ab9a00720726ce'),
                value: (
                  <span data-test={APPLIED_RATE_CARD_OVERVIEW_UNITS_TEST_ID}>
                    {appliedRateCard.units ?? '-'}
                  </span>
                ),
              },
              getEffectiveDateItem(),
            ]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeader
          title={translate('text_1791485670326kzyf0uhsn23')}
          description={translate('text_1791833366840abmtqvj371f')}
          contentClassName="gap-2"
          action={{
            label: translate('text_1791485670326hf9c29bdje6'),
            dataTest: APPLIED_RATE_CARD_OVERVIEW_ADD_PHASE_TEST_ID,
            hidden: createPhase.hidden,
            disabled: createPhase.disabled,
            onClick: createPhase.open,
          }}
        />

        <AppliedRateCardPhasesTable
          phases={appliedRateCard.ratePhases}
          rateCard={rateCard}
          getPhaseHref={getPhaseHref}
          getPhaseActions={getPhaseActions}
        />
      </section>
    </div>
  )
}
