import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button, Table, Typography } from '~/components/designSystem'
import {
  Filters,
  formatFiltersForRevenueStreamsCustomersQuery,
  RevenueStreamsCustomersAvailableFilters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REVENUE_STREAMS_BREAKDOWN_CUSTOMER_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  useGetRevenueStreamsCustomerBreakdownQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getRevenueStreamsCustomerBreakdown($currency: CurrencyEnum, $limit: Int) {
    dataApiRevenueStreamsCustomers(currency: $currency, limit: $limit) {
      collection {
        amountCurrency
        customerName
        externalCustomerId
        netRevenueAmountCents
        netRevenueShare
      }
    }
  }
`

type RevenueStreamsCustomerBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const RevenueStreamsCustomerBreakdownSection = ({
  premiumWarningDialogRef,
}: RevenueStreamsCustomerBreakdownSectionProps) => {
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()
  const { translate } = useInternationalization()

  const hasAccessToRevenueAnalyticsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.RevenueAnalytics,
  )
  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const filtersForRevenueStreamsQuery = useMemo(() => {
    if (!hasAccessToRevenueAnalyticsFeature) {
      return {
        currency: defaultCurrency,
      }
    }

    return formatFiltersForRevenueStreamsCustomersQuery(searchParams)
  }, [hasAccessToRevenueAnalyticsFeature, searchParams, defaultCurrency])

  const {
    data: revenueStreamsCustomerBreakdownData,
    loading: revenueStreamsCustomerBreakdownLoading,
    error: revenueStreamsCustomerBreakdownError,
  } = useGetRevenueStreamsCustomerBreakdownQuery({
    variables: {
      ...filtersForRevenueStreamsQuery,
      limit: 4,
    },
  })

  return (
    <>
      <div className="flex flex-col">
        <Filters.Provider
          filtersNamePrefix={REVENUE_STREAMS_BREAKDOWN_CUSTOMER_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
          }}
          availableFilters={RevenueStreamsCustomersAvailableFilters}
          buttonOpener={({ onClick }) => (
            <Button
              startIcon="filter"
              endIcon={!hasAccessToRevenueAnalyticsFeature ? 'sparkles' : undefined}
              size="small"
              variant="quaternary"
              onClick={(e) => {
                if (!hasAccessToRevenueAnalyticsFeature) {
                  e.stopPropagation()
                  premiumWarningDialogRef.current?.openDialog()
                } else {
                  onClick()
                }
              }}
            >
              {translate('text_66ab42d4ece7e6b7078993ad')}
            </Button>
          )}
        >
          <div className="flex w-full flex-col gap-3 py-3 shadow-b">
            <Filters.Component />
          </div>
        </Filters.Provider>
      </div>

      <Table
        name="revenue-streams-customer-breakdown"
        containerSize={{ default: 0 }}
        rowSize={72}
        isLoading={revenueStreamsCustomerBreakdownLoading}
        hasError={!!revenueStreamsCustomerBreakdownError}
        data={
          revenueStreamsCustomerBreakdownData?.dataApiRevenueStreamsCustomers.collection.map(
            (c) => ({
              id: c.externalCustomerId,
              ...c,
            }),
          ) || []
        }
        placeholder={{
          emptyState: {
            title: translate('text_17422274967581grox8em361'),
            subtitle: translate('text_1742227496758jg629m9fga6'),
          },
        }}
        columns={[
          {
            key: 'customerName',
            title: translate('text_63d3a658c6d84a5843032145'),
            maxSpace: true,
            minWidth: 200,
            content({ customerName, externalCustomerId }) {
              return (
                <>
                  <Typography color="grey700" variant="bodyHl" noWrap>
                    {customerName}
                  </Typography>
                  <Typography variant="caption" color="grey600" noWrap>
                    {externalCustomerId}
                  </Typography>
                </>
              )
            },
          },
          {
            key: 'netRevenueShare',
            title: translate('text_17422232171950c2u9u3vuq7'),
            textAlign: 'right',
            minWidth: 134,
            content({ netRevenueShare, netRevenueAmountCents, amountCurrency }) {
              return (
                <div className="flex items-center gap-2">
                  <Typography variant="body" color="grey700" noWrap>
                    {intlFormatNumber(
                      deserializeAmount(netRevenueAmountCents || 0, amountCurrency),
                      {
                        style: 'currency',
                        currency: defaultCurrency,
                      },
                    )}
                  </Typography>
                  <Typography className="w-16 text-right" variant="body" color="grey600" noWrap>
                    {intlFormatNumber(netRevenueShare, { style: 'percent' })}
                  </Typography>
                </div>
              )
            },
          },
        ]}
      />
    </>
  )
}
