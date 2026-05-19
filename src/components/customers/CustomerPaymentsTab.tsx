import { FC } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import { CustomerPaymentsList } from '~/components/customers/CustomerPaymentsList'
import { Filters } from '~/components/designSystem/Filters'
import { CustomerPaymentsAvailableFilters } from '~/components/designSystem/Filters/types'
import { formatFiltersForCustomerPaymentsQuery } from '~/components/designSystem/Filters/utils'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CUSTOMER_PAYMENTS_FILTER_PREFIX } from '~/core/constants/filters'
import { CREATE_PAYMENT_ROUTE, useNavigate } from '~/core/router'
import { FeatureFlagEnum, useGetPaymentsListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

interface CustomerPaymentsTabProps {
  externalCustomerId: string
}

export const CustomerPaymentsTab: FC<CustomerPaymentsTabProps> = ({ externalCustomerId }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()
  const { hasFeatureFlag } = useOrganizationInfos()
  const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)
  const [searchParams] = useSearchParams()

  const { currency } = formatFiltersForCustomerPaymentsQuery(searchParams)

  const { data, loading, fetchMore } = useGetPaymentsListQuery({
    variables: { externalCustomerId: externalCustomerId as string, limit: 20, currency },
    skip: !externalCustomerId,
  })

  const payments = data?.payments.collection || []
  const isFiltering = !!currency

  const urlSearchParams = new URLSearchParams({ externalId: externalCustomerId })

  const canRecordPayment = hasPermissions(['paymentsCreate']) && isPremium

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <Skeleton variant="text" className="w-56" />
      ) : (
        <PageSectionTitle
          className="mb-0"
          title={translate('text_6672ebb8b1b50be550eccbed')}
          subtitle={translate('text_17791984503020n5cyfczunj')}
          action={
            canRecordPayment
              ? {
                  title: translate('text_1737471851634wpeojigr27w'),
                  onClick: () => {
                    navigate(generatePath(`${CREATE_PAYMENT_ROUTE}?${urlSearchParams.toString()}`))
                  },
                }
              : undefined
          }
        />
      )}

      {hasMultiCurrency && (
        <Filters.Provider
          filtersNamePrefix={CUSTOMER_PAYMENTS_FILTER_PREFIX}
          availableFilters={CustomerPaymentsAvailableFilters}
        >
          <div className="flex items-center gap-2">
            <Filters.Component />
          </div>
        </Filters.Provider>
      )}

      <CustomerPaymentsList
        payments={payments}
        loading={loading}
        fetchMore={fetchMore}
        metadata={data?.payments?.metadata}
        placeholder={{
          emptyState: isFiltering
            ? {
                title: translate('text_173805604017831h2cebcami'),
                subtitle: translate('text_66ab48ea4ed9cd01084c60b8'),
              }
            : {
                title: translate('text_173805604017831h2cebcami'),
                subtitle: translate('text_1738056040178gw94jzmzckx'),
              },
        }}
      />
    </div>
  )
}
