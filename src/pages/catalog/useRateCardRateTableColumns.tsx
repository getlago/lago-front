import { gql } from '@apollo/client'

import { Status } from '~/components/designSystem/Status'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { rateCardRateStatusMapping } from '~/core/constants/statusRateCardRateMapping'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  RateCardRateForDeleteRateCardRateDialogFragmentDoc,
  RateCardRateForDrawerFragmentDoc,
  RateCardRateForListFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY } from './drawers/rateCardRate/constants'
import { formatActiveRate } from './utils/formatActiveRate'

// Only `createdAt` is listed directly; every other field the cells read comes from the spread
// `RateCardRateForDrawer`.
gql`
  fragment RateCardRateForList on RateCardRate {
    id
    createdAt
    ...RateCardRateForDrawer
    ...RateCardRateForDeleteRateCardRateDialog
  }

  ${RateCardRateForDrawerFragmentDoc}
  ${RateCardRateForDeleteRateCardRateDialogFragmentDoc}
`

export const RATE_CARD_RATE_TABLE_STATUS_TEST_ID = 'rate-card-rate-status'

export const useRateCardRateTableColumns = ({
  currency,
  appliedPricingUnitCode,
}: {
  currency?: CurrencyEnum | null
  appliedPricingUnitCode?: string | null
}): Array<TableColumn<RateCardRateForListFragment>> => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { pricingUnits } = useCustomPricingUnits()

  // The card stores the code, but prices are labelled with the short name - passing the code
  // through would print "10 credits" here and "10 cr" on the details page.
  const pricingUnitShortName = pricingUnits.find(
    (unit) => unit.code === appliedPricingUnitCode,
  )?.shortName

  return [
    {
      key: 'status',
      title: translate('text_63ac86d797f728a87b2f9fa7'),
      minWidth: 120,
      content: ({ status }) => (
        <Status
          {...rateCardRateStatusMapping(status)}
          data-test={RATE_CARD_RATE_TABLE_STATUS_TEST_ID}
        />
      ),
    },
    {
      key: 'effectiveFrom',
      title: translate(RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY),
      minWidth: 140,
      content: ({ effectiveFrom }) => (
        <Typography color="grey600" variant="body" noWrap>
          {intlFormatDateTime(effectiveFrom, { timezone: TimezoneEnum.TzUtc }).date}
        </Typography>
      ),
    },
    {
      key: 'code',
      title: translate('text_629728388c4d2300e2d380b7'),
      minWidth: 200,
      maxSpace: true,
      content: ({ code }) => (
        <TypographyWithCopy compact noWrap variant="body" color="grey700">
          {code}
        </TypographyWithCopy>
      ),
    },
    {
      key: 'rateProperties.amount',
      title: translate('text_1780498504241di3s12o655k'),
      textAlign: 'right',
      minWidth: 200,
      content: (rate) => {
        const { primary, secondary } = formatActiveRate(rate, {
          translate,
          currency,
          appliedPricingUnitCode: pricingUnitShortName,
        })

        return (
          <>
            <Typography color="grey700" variant="body" noWrap>
              {primary}
            </Typography>
            {secondary ? (
              <Typography color="grey600" variant="caption" noWrap>
                {secondary}
              </Typography>
            ) : null}
          </>
        )
      },
    },
    {
      key: 'createdAt',
      title: translate('text_629728388c4d2300e2d380e3'),
      textAlign: 'right',
      minWidth: 140,
      content: ({ createdAt }) => (
        <Typography color="grey600" variant="body" noWrap>
          {intlFormatDateTimeOrgaTZ(createdAt).date}
        </Typography>
      ),
    },
  ]
}
