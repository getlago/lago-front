import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button, Table, Typography } from '~/components/designSystem'
import {
  Filters,
  formatFiltersForMrrPlansQuery,
  MrrBreakdownPlansAvailableFilters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { MRR_BREAKDOWN_PLANS_FILTER_PREFIX } from '~/core/constants/filters'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  useGetMrrPlanBreakdownQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const ITEM_COUNT = 4

gql`
  query getMrrPlanBreakdown($currency: CurrencyEnum, $limit: Int) {
    dataApiMrrsPlans(currency: $currency, limit: $limit) {
      collection {
        activeCustomersCount
        activeCustomersShare
        amountCurrency
        mrr
        mrrShare
        planCode
        planId
        planInterval
        planName
      }
    }
  }
`

type MrrBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const MrrBreakdownSection = ({ premiumWarningDialogRef }: MrrBreakdownSectionProps) => {
  const [searchParams] = useSearchParams()
  const { translate } = useInternationalization()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )
  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const filtersForMrrQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
      }
    }

    return formatFiltersForMrrPlansQuery(searchParams)
  }, [hasAccessToAnalyticsDashboardsFeature, searchParams, defaultCurrency])

  const {
    data: mrrPlanBreakdownData,
    loading: mrrPlanBreakdownLoading,
    error: mrrPlanBreakdownError,
  } = useGetMrrPlanBreakdownQuery({
    variables: {
      ...filtersForMrrQuery,
      limit: ITEM_COUNT,
    },
  })

  return (
    <section className="flex flex-col">
      <div className="mb-6 flex flex-col gap-2">
        <Typography className="mb-2" variant="subhead" color="grey700">
          {translate('text_17424672790819r1ua5ujpt3')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1742467700262idvii8tpg2w')}
        </Typography>
      </div>

      <div className="flex flex-col">
        <Filters.Provider
          filtersNamePrefix={MRR_BREAKDOWN_PLANS_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
          }}
          availableFilters={MrrBreakdownPlansAvailableFilters}
          buttonOpener={({ onClick }) => (
            <Button
              startIcon="filter"
              endIcon={!hasAccessToAnalyticsDashboardsFeature ? 'sparkles' : undefined}
              size="small"
              variant="quaternary"
              onClick={(e) => {
                if (!hasAccessToAnalyticsDashboardsFeature) {
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
        name="mrr-plan-breakdown"
        containerSize={{ default: 0 }}
        rowSize={72}
        loadingRowCount={ITEM_COUNT}
        isLoading={mrrPlanBreakdownLoading}
        hasError={!!mrrPlanBreakdownError}
        data={
          mrrPlanBreakdownData?.dataApiMrrsPlans.collection.map((p) => ({
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
                    {planName || '-'}
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
            minWidth: 120,
            content({ planInterval }) {
              return (
                <Typography variant="body" noWrap>
                  {translate(getIntervalTranslationKey[planInterval])}
                </Typography>
              )
            },
          },
          {
            key: 'activeCustomersShare',
            textAlign: 'right',
            title: translate('text_1742480465327lfl86dyjywx'),
            minWidth: 147,
            content({ activeCustomersShare, activeCustomersCount }) {
              return (
                <div className="flex items-center gap-2">
                  <Typography variant="body" color="grey700" noWrap>
                    {activeCustomersCount}
                  </Typography>
                  <Typography className="w-16" variant="body" color="grey600" noWrap>
                    {intlFormatNumber(activeCustomersShare, { style: 'percent' })}
                  </Typography>
                </div>
              )
            },
          },
          {
            key: 'mrrShare',
            title: translate('text_6553885df387fd0097fd738c'),
            textAlign: 'right',
            minWidth: 148,
            content({ mrrShare, mrr, amountCurrency }) {
              return (
                <div className="flex items-center gap-2">
                  <Typography variant="body" color="grey700" noWrap>
                    {intlFormatNumber(deserializeAmount(mrr || 0, amountCurrency), {
                      style: 'currency',
                      currency: defaultCurrency,
                    })}
                  </Typography>
                  <Typography className="w-16 text-right" variant="body" color="grey600" noWrap>
                    {intlFormatNumber(mrrShare, { style: 'percent' })}
                  </Typography>
                </div>
              )
            },
          },
        ]}
      />
    </section>
  )
}
