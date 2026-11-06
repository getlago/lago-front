import { gql } from '@apollo/client'
import { useState } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, useGetContractCurrentUsageTotalQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { ContractUsageCategoryRail } from './ContractUsageCategoryRail'
import { ContractUsageTable } from './ContractUsageTable'

gql`
  query getContractCurrentUsageTotal($contractId: ID!) {
    contractCurrentUsageTotal(contractId: $contractId) {
      totalAmountCents
    }
  }
`

type ContractUsageSectionProps = {
  contractId: string
  currency?: CurrencyEnum
}

export const ContractUsageSection = ({
  contractId,
  currency,
}: ContractUsageSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { data, error, loading, refetch } = useGetContractCurrentUsageTotalQuery({
    variables: { contractId },
    fetchPolicy: 'network-only',
  })
  const [railHasError, setRailHasError] = useState(false)
  const [tableHasError, setTableHasError] = useState(false)
  // Bumping this remounts the rail and table (via `key`), which is what makes "Refresh" actually
  // refresh all 3 of this tab's queries, not just the total line's own `refetch()` - a fresh mount
  // re-fires `useQuery` under each child's existing `network-only` fetch policy for free.
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = (): void => {
    setRailHasError(false)
    setTableHasError(false)
    setRefreshKey((key) => key + 1)
    refetch()
  }

  if (error || railHasError || tableHasError) {
    return (
      <GenericPlaceholder
        title={translate('text_62c3f3fca8a1625624e83379')}
        subtitle={translate('text_1726498444629i1fpjyvh0kg')}
        buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
        buttonVariant="primary"
        buttonAction={handleRefresh}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1725983967306cf8dwr2r4u2')}
        action={{
          label: translate('text_1725983967306qz0npfuhlo1'),
          onClick: handleRefresh,
        }}
      />

      <div className="flex items-center justify-between">
        <Typography variant="body" color="grey600">
          {translate('text_17939706328430e4ck8frime')}
        </Typography>
        <Typography variant="subhead1" color="grey700">
          {loading
            ? '...'
            : intlFormatNumber(
                deserializeAmount(
                  data?.contractCurrentUsageTotal.totalAmountCents ?? 0,
                  currency ?? CurrencyEnum.Usd,
                ),
                { currencyDisplay: 'symbol', currency },
              )}
        </Typography>
      </div>

      <div className="flex gap-6">
        <ContractUsageCategoryRail
          key={`rail-${refreshKey}`}
          contractId={contractId}
          onErrorChange={setRailHasError}
        />
        <ContractUsageTable
          key={`table-${refreshKey}`}
          contractId={contractId}
          currency={currency}
          onErrorChange={setTableHasError}
        />
      </div>
    </section>
  )
}
