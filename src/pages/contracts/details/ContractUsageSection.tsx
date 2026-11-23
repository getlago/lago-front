import { gql } from '@apollo/client'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Icon } from '~/components/designSystem/Icon'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  TimezoneEnum,
  useGetContractCurrentUsageTotalQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { ContractUsageCategoryRail } from './ContractUsageCategoryRail'
import { ContractUsageTable } from './ContractUsageTable'
import { useContractUsageCategories } from './useContractUsageCategories'

gql`
  query getContractCurrentUsageTotal($contractId: ID!) {
    contractCurrentUsageTotal(contractId: $contractId) {
      totalAmountCents
      taxesUnavailable
      fromDatetime
      toDatetime
      productCategoryTotals {
        productCategory {
          id
        }
        totalAmountCents
        fromDatetime
        toDatetime
      }
    }
  }
`

export const CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID = 'contract-usage-category-total'

type UsageTotalLineProps = {
  title: string
  amountCents: string | number
  fromDatetime?: string | null
  toDatetime?: string | null
  currency: CurrencyEnum
  customerTimezone: TimezoneEnum
  isLoading: boolean
  taxesUnavailable?: boolean
  className: string
  dataTest?: string
}

const UsageTotalLine = ({
  title,
  amountCents,
  fromDatetime,
  toDatetime,
  currency,
  customerTimezone,
  isLoading,
  taxesUnavailable,
  className,
  dataTest,
}: UsageTotalLineProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className={className} data-test={dataTest}>
      <div className="flex min-w-0 flex-col gap-1">
        <Typography variant="bodyHl" color="grey700" noWrap>
          {title}
        </Typography>
        {!!fromDatetime && !!toDatetime && (
          <Typography variant="caption" color="grey600">
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: intlFormatDateTime(fromDatetime, { timezone: customerTimezone }).date,
              toDate: intlFormatDateTime(toDatetime, { timezone: customerTimezone }).date,
            })}
          </Typography>
        )}
      </div>
      <div className="flex items-center gap-1">
        {taxesUnavailable && (
          <Tooltip placement="top-end" title={translate('text_1793976872470dc2ih3k5q1n')}>
            <Icon name="info-circle" />
          </Tooltip>
        )}
        <Typography variant="body" color="grey700">
          {isLoading ? (
            <Skeleton variant="text" className="w-20" />
          ) : (
            intlFormatNumber(deserializeAmount(amountCents, currency), {
              currencyDisplay: 'symbol',
              currency,
            })
          )}
        </Typography>
      </div>
    </div>
  )
}

type ContractUsageSectionProps = {
  contractId: string
  currency: CurrencyEnum
  customerTimezone: TimezoneEnum
}

export const ContractUsageSection = ({
  contractId,
  currency,
  customerTimezone,
}: ContractUsageSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const { data, error, loading, refetch } = useGetContractCurrentUsageTotalQuery({
    variables: { contractId },
    fetchPolicy: 'network-only',
  })
  const isTotalLoading = loading && !data
  const [refreshToken, setRefreshToken] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const usageCategories = useContractUsageCategories({ contractId, refreshToken })

  const { categories } = usageCategories
  const showStandalone = usageCategories.hasStandaloneProducts || categories.length === 0
  const hasSeveralSections = categories.length + (showStandalone ? 1 : 0) > 1
  const urlCategoryId = searchParams.get('categoryId')

  const isUrlCategoryUsable =
    !usageCategories.isResolved ||
    usageCategories.hasError ||
    categories.some(({ id }) => id === urlCategoryId)

  const getActiveCategoryId = (): string | null | undefined => {
    if (urlCategoryId && isUrlCategoryUsable) return urlCategoryId
    if (!usageCategories.isResolved) return undefined
    if (showStandalone) return null

    return categories[0].id
  }

  const activeCategoryId = getActiveCategoryId()
  const activeCategory = categories.find(({ id }) => id === activeCategoryId)
  const activeCategoryTotal = data?.contractCurrentUsageTotal.productCategoryTotals.find(
    ({ productCategory }) => (productCategory?.id ?? null) === activeCategoryId,
  )

  const handleRefresh = (): void => {
    setRefreshToken((token) => token + 1)
    refetch()
  }

  if (error) {
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

      <UsageTotalLine
        className="flex items-center justify-between pb-6 shadow-b"
        title={translate('text_17939706328430e4ck8frime')}
        amountCents={data?.contractCurrentUsageTotal.totalAmountCents ?? 0}
        fromDatetime={data?.contractCurrentUsageTotal.fromDatetime}
        toDatetime={data?.contractCurrentUsageTotal.toDatetime}
        currency={currency}
        customerTimezone={customerTimezone}
        isLoading={isTotalLoading}
        taxesUnavailable={data?.contractCurrentUsageTotal.taxesUnavailable}
      />

      <div className="flex gap-6">
        <ContractUsageCategoryRail
          categories={categories}
          showStandalone={showStandalone}
          activeCategoryId={activeCategoryId}
          isLoading={!usageCategories.isResolved}
          hasError={usageCategories.hasError}
          onRetry={usageCategories.refetch}
        />
        {activeCategoryId !== undefined && (
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {hasSeveralSections && (
              <UsageTotalLine
                className="flex items-center justify-between gap-6 pb-3 shadow-b"
                dataTest={CONTRACT_USAGE_CATEGORY_TOTAL_TEST_ID}
                title={translate('text_17951819535853oq0ffmmynt', {
                  category:
                    activeCategory?.displayName ?? translate('text_17918333668416t409ijtqn3'),
                })}
                amountCents={activeCategoryTotal?.totalAmountCents ?? 0}
                fromDatetime={activeCategoryTotal?.fromDatetime}
                toDatetime={activeCategoryTotal?.toDatetime}
                currency={currency}
                customerTimezone={customerTimezone}
                isLoading={isTotalLoading}
                taxesUnavailable={data?.contractCurrentUsageTotal.taxesUnavailable}
              />
            )}
            <ContractUsageTable
              key={activeCategoryId ?? 'standalone'}
              contractId={contractId}
              categoryId={activeCategoryId}
              currency={currency}
              customerTimezone={customerTimezone}
              refreshToken={refreshToken}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              filterOptions={usageCategories.getFilterOptions(activeCategoryId)}
            />
          </div>
        )}
      </div>
    </section>
  )
}
