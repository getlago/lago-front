import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useState } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { CurrencyEnum, useGetContractCurrentUsageTotalQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { ContractUsageCategoryRail } from './ContractUsageCategoryRail'
import { ContractUsageTable } from './ContractUsageTable'

gql`
  query getContractCurrentUsageTotal($contractId: ID!) {
    contractCurrentUsageTotal(contractId: $contractId) {
      totalAmountCents
      taxesUnavailable
      fromDatetime
      toDatetime
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
  // Passed to the rail/table as refreshToken - re-fetches both in place, not a remount, so
  // "Refresh" doesn't reset their own local state (search term, page size).
  const [refreshToken, setRefreshToken] = useState(0)

  const handleRefresh = (): void => {
    setRailHasError(false)
    setTableHasError(false)
    setRefreshToken((token) => token + 1)
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
          label: translate('text_1793992618732gc6gikxy0sb'),
          onClick: handleRefresh,
        }}
      />

      <div className="flex items-center justify-between pb-6 shadow-b">
        <div className="flex flex-col gap-1">
          <Typography variant="bodyHl" color="grey700">
            {translate('text_17939706328430e4ck8frime')}
          </Typography>
          {!!data?.contractCurrentUsageTotal.fromDatetime &&
            !!data?.contractCurrentUsageTotal.toDatetime && (
              <Typography variant="caption" color="grey600">
                {translate('text_633dae57ca9a923dd53c2097', {
                  fromDate: intlFormatDateTime(data.contractCurrentUsageTotal.fromDatetime).date,
                  toDate: intlFormatDateTime(data.contractCurrentUsageTotal.toDatetime).date,
                })}
              </Typography>
            )}
        </div>
        <div className="flex items-center gap-1">
          {data?.contractCurrentUsageTotal.taxesUnavailable && (
            <Tooltip placement="top-end" title={translate('text_1793976872470dc2ih3k5q1n')}>
              <Icon name="info-circle" />
            </Tooltip>
          )}
          <Typography variant="body" color="grey700">
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
      </div>

      <div className="flex gap-6">
        <ContractUsageCategoryRail
          contractId={contractId}
          onErrorChange={setRailHasError}
          refreshToken={refreshToken}
        />
        <ContractUsageTable
          contractId={contractId}
          currency={currency}
          onErrorChange={setTableHasError}
          refreshToken={refreshToken}
        />
      </div>
    </section>
  )
}
