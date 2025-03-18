import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button, Table, Typography } from '~/components/designSystem'
import {
  Filters,
  formatFiltersForRevenueStreamsPlansQuery,
  RevenueStreamsPlansAvailableFilters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REVENUE_STREAMS_BREAKDOWN_PLAN_FILTER_PREFIX } from '~/core/constants/filters'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  useGetRevenueStreamsPlanBreakdownQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const ITEM_COUNT = 4

gql`
  query getRevenueStreamsPlanBreakdown($currency: CurrencyEnum, $limit: Int) {
    dataApiRevenueStreamsPlans(currency: $currency, limit: $limit) {
      collection {
        amountCurrency
        customersCount
        customersShare
        netRevenueAmountCents
        netRevenueShare
        planCode
        planId
        planInterval
        planName
      }
    }
  }
`

type RevenueStreamsPlanBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const RevenueStreamsPlanBreakdownSection = ({
  premiumWarningDialogRef,
}: RevenueStreamsPlanBreakdownSectionProps) => {
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

    return formatFiltersForRevenueStreamsPlansQuery(searchParams)
  }, [hasAccessToRevenueAnalyticsFeature, searchParams, defaultCurrency])

  const {
    data: revenueStreamsPlanBreakdownData,
    loading: revenueStreamsPlanBreakdownLoading,
    error: revenueStreamsPlanBreakdownError,
  } = useGetRevenueStreamsPlanBreakdownQuery({
    variables: {
      ...filtersForRevenueStreamsQuery,
      limit: ITEM_COUNT,
    },
  })

  return (
    <>
      <div className="flex flex-col">
        <Filters.Provider
          filtersNamePrefix={REVENUE_STREAMS_BREAKDOWN_PLAN_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
          }}
          availableFilters={RevenueStreamsPlansAvailableFilters}
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
        name="revenue-streams-plan-breakdown"
        containerSize={{ default: 0 }}
        rowSize={72}
        loadingRowCount={ITEM_COUNT}
        isLoading={revenueStreamsPlanBreakdownLoading}
        hasError={!!revenueStreamsPlanBreakdownError}
        data={
          revenueStreamsPlanBreakdownData?.dataApiRevenueStreamsPlans.collection.map((p) => ({
            id: p.planId,
            ...p,
          })) || []
        }
        placeholder={{
          emptyState: {
            title: translate('text_17422274791228swi7c4ydc7'),
            subtitle: translate('text_17422274791226kjpamwz3pe'),
          },
        }}
        columns={[
          {
            key: 'planName',
            title: translate('text_63d3a658c6d84a5843032145'),
            maxSpace: true,
            minWidth: 200,
            content({ planName, planCode }) {
              return (
                <>
                  <Typography color="grey700" variant="bodyHl" noWrap>
                    {planName}
                  </Typography>
                  <Typography variant="caption" color="grey600" noWrap>
                    {planCode}
                  </Typography>
                </>
              )
            },
          },
          {
            key: 'planInterval',
            title: translate('text_65201b8216455901fe273dc1'),
            minWidth: 112,
            content({ planInterval }) {
              return (
                <Typography variant="body" noWrap>
                  {translate(getIntervalTranslationKey[planInterval])}
                </Typography>
              )
            },
          },
          {
            key: 'customersShare',
            textAlign: 'right',
            title: translate('text_624efab67eb2570101d117a5'),
            minWidth: 134,
            content({ customersShare, customersCount }) {
              return (
                <div className="flex items-center gap-2">
                  <Typography variant="body" color="grey700" noWrap>
                    {customersCount}
                  </Typography>
                  <Typography className="w-16" variant="body" color="grey600" noWrap>
                    {intlFormatNumber(customersShare, { style: 'percent' })}
                  </Typography>
                </div>
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
