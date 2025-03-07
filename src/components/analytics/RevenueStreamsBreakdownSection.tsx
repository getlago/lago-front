import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem'
import { CurrencyEnum, useGetRevenueStreamsPlansQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getRevenueStreamsPlans($currency: CurrencyEnum, $limit: Int) {
    dataApiRevenueStreamsPlans(currency: $currency, limit: $limit) {
      collection {
        amountCurrency
        customersCount
        customersShare
        netRevenueAmountCents
        netRevenueShare
        planCode
        planInterval
        planName
      }
    }
  }
`

const RevenueStreamsBreakdownSection = () => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const currency = organization?.defaultCurrency || CurrencyEnum.Usd

  const {
    data: revenueStreamsPlanData,
    loading: revenueStreamsPlanLoading,
    error: revenueStreamsPlanError,
  } = useGetRevenueStreamsPlansQuery({
    variables: {
      currency,
      limit: 4,
    },
  })

  console.log(revenueStreamsPlanData)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography className="mb-2" variant="subhead" color="grey700">
          {translate('text_1739206045861dgu7ype5jyx')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_17392060910488ax2d18o9u9')}
        </Typography>
      </div>

      {/* TODO: Filters */}
      {/* TODO: Table */}
    </section>
  )
}

export default RevenueStreamsBreakdownSection
