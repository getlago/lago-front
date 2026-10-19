import { generatePath } from 'react-router'

import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { getFirstPathSegment } from '~/core/router/utils/getFirstPathSegment'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { intlFormatDateTime } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID = 'rate-phase-details-rate-history-link'

type RatePhaseRateEffectiveDateProps = {
  effectiveFrom: string
  rateCardId: string
}

export const RatePhaseRateEffectiveDate = ({
  effectiveFrom,
  rateCardId,
}: RatePhaseRateEffectiveDateProps): JSX.Element => {
  const { translate } = useInternationalization()

  // Drawers render outside the router, so no `useParams`: the org slug is read from the URL.
  const rateHistoryPath = prependOrgSlug(
    generatePath(RATE_CARD_DETAILS_ROUTE, {
      rateCardId,
      tab: RateCardDetailsTabsOptionsEnum.rates,
    }),
    getFirstPathSegment(window.location.pathname),
  )

  return (
    <span className="flex items-center gap-2">
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
