import { generatePath } from 'react-router'

import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { intlFormatDateTime } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID = 'rate-phase-details-rate-history-link'
export const RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID = 'rate-phase-rate-effective-date'

export const getRateHistoryPath = (
  rateCardId: string,
  organizationSlug: string | undefined,
): string =>
  prependOrgSlug(
    generatePath(RATE_CARD_DETAILS_ROUTE, {
      rateCardId,
      tab: RateCardDetailsTabsOptionsEnum.rates,
    }),
    organizationSlug,
  )

type RatePhaseRateEffectiveDateProps = {
  effectiveFrom: string
  rateHistoryPath: string
}

export const RatePhaseRateEffectiveDate = ({
  effectiveFrom,
  rateHistoryPath,
}: RatePhaseRateEffectiveDateProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <span className="flex items-center gap-2" data-test={RATE_PHASE_RATE_EFFECTIVE_DATE_TEST_ID}>
      {intlFormatDateTime(effectiveFrom, { timezone: TimezoneEnum.TzUtc }).date}
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
  )
}
