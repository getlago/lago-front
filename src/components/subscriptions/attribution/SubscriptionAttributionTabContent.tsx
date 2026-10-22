import { gql, NetworkStatus } from '@apollo/client'
import { useState } from 'react'
import { useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import {
  AttributedUsageBasisEnum,
  CurrencyEnum,
  useGetSubscriptionAttributedUsageQuery,
  useGetSubscriptionAttributionChargesQuery,
  useGetSubscriptionAttributionSetupQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AttributionFlatTable, AttributionTableRow } from './AttributionFlatTable'
import { AttributionToolbarSelect } from './AttributionToolbarSelect'
import {
  AttributionGroupByEnum,
  buildAttributionColumns,
  getAttributionChargeLabel,
  isAttributionAmountAvailable,
} from './buildAttributionColumns'

export const ATTRIBUTION_REFRESH_BUTTON_TEST_ID = 'attribution-refresh-button'
export const ATTRIBUTION_GROUP_ROWS_BY_TEST_ID = 'attribution-group-rows-by'
export const ATTRIBUTION_LIST_BY_TEST_ID = 'attribution-list-by'
export const ATTRIBUTION_CHARGES_TEST_ID = 'attribution-charges'
export const ATTRIBUTION_SHOW_TEST_ID = 'attribution-show'

const ALL_VALUE = 'all'
const ATTRIBUTION_ROWS_LIMIT = 50
const ATTRIBUTION_TYPES_LIMIT = 100

gql`
  fragment AttributionChargeUsage on AttributedUsageChargeUsage {
    units
    amountCents
    charge {
      id
      code
      invoiceDisplayName
      chargeModel
      billableMetric {
        id
        name
      }
      filters {
        id
      }
    }
    chargeFilter {
      id
      invoiceDisplayName
      values
    }
  }

  query getSubscriptionAttributionSetup($subscriptionId: ID!, $limit: Int) {
    subscription(id: $subscriptionId) {
      id
      customer {
        id
        displayName
      }
    }
    flatAttributionTypes: usageAttributionTypes(role: flat, limit: $limit) {
      collection {
        id
        code
        name
      }
    }
    rootAttributionTypes: usageAttributionTypes(role: hierarchical, roots: true, limit: 1) {
      collection {
        id
        code
        name
      }
    }
  }

  query getSubscriptionAttributionCharges($subscriptionId: ID!, $groupBy: String!) {
    attributedUsage(subscriptionId: $subscriptionId, groupBy: $groupBy, limit: 1) {
      totals {
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
    }
  }

  query getSubscriptionAttributedUsage(
    $subscriptionId: ID!
    $groupBy: String!
    $basis: AttributedUsageBasisEnum
    $chargeIds: [ID!]
    $splitChargeId: ID
    $page: Int
    $limit: Int
  ) {
    attributedUsage(
      subscriptionId: $subscriptionId
      groupBy: $groupBy
      basis: $basis
      chargeIds: $chargeIds
      splitChargeId: $splitChargeId
      page: $page
      limit: $limit
    ) {
      currency
      metadata {
        currentPage
        totalPages
      }
      rows {
        value
        amountCents
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
      unattributed {
        amountCents
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
      totals {
        amountCents
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
    }
  }
`

export const SubscriptionAttributionTabContent = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { subscriptionId = '' } = useParams()

  const [groupRowsBy, setGroupRowsBy] = useState<AttributionGroupByEnum>(
    AttributionGroupByEnum.hierarchical,
  )
  const [listByCode, setListByCode] = useState<string | null>(null)
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null)
  const [basis, setBasis] = useState<AttributedUsageBasisEnum>(AttributedUsageBasisEnum.Units)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    data: setupData,
    loading: isSetupLoading,
    error: setupError,
    refetch: refetchSetup,
  } = useGetSubscriptionAttributionSetupQuery({
    variables: { subscriptionId, limit: ATTRIBUTION_TYPES_LIMIT },
    skip: !subscriptionId,
  })

  const flatTypes = setupData?.flatAttributionTypes.collection ?? []
  const listByType = flatTypes.find((type) => type.code === listByCode)
  const fallbackGroupBy =
    flatTypes[0]?.code ?? setupData?.rootAttributionTypes.collection[0]?.code ?? ''
  const groupBy = listByType?.code ?? fallbackGroupBy

  const {
    data: chargesData,
    loading: isChargesLoading,
    refetch: refetchCharges,
  } = useGetSubscriptionAttributionChargesQuery({
    variables: { subscriptionId, groupBy: fallbackGroupBy },
    skip: !fallbackGroupBy,
  })

  const charges = (chargesData?.attributedUsage.totals.chargesUsage ?? []).map(
    ({ charge }) => charge,
  )
  const selectedCharge = charges.find((charge) => charge.id === selectedChargeId)

  const {
    data: usageData,
    loading: isUsageQueryLoading,
    networkStatus: usageNetworkStatus,
    error: usageError,
    refetch: refetchUsage,
    fetchMore: fetchMoreUsage,
  } = useGetSubscriptionAttributedUsageQuery({
    variables: {
      subscriptionId,
      groupBy,
      basis,
      chargeIds: selectedCharge ? [selectedCharge.id] : undefined,
      splitChargeId: selectedCharge?.filters?.length ? selectedCharge.id : undefined,
      page: 1,
      limit: ATTRIBUTION_ROWS_LIMIT,
    },
    skip: !groupBy,
    notifyOnNetworkStatusChange: true,
  })

  const isFetchingMoreRows = usageNetworkStatus === NetworkStatus.fetchMore
  const isUsageLoading = isUsageQueryLoading && !isFetchingMoreRows

  const isAmountAvailable = isAttributionAmountAvailable(
    selectedCharge ? [selectedCharge] : charges,
  )

  const refetch = (): void => {
    refetchSetup()

    if (!groupBy) return

    refetchCharges()
    refetchUsage()
  }

  const onChargeChange = (value: string): void => {
    const nextCharge = charges.find((charge) => charge.id === value)

    setSelectedChargeId(nextCharge?.id ?? null)
    setIsExpanded(false)

    if (!isAttributionAmountAvailable(nextCharge ? [nextCharge] : charges)) {
      setBasis(AttributedUsageBasisEnum.Units)
    }
  }

  const attributedUsage = usageData?.attributedUsage
  const hasMoreRows =
    !!listByType &&
    !!attributedUsage &&
    attributedUsage.metadata.currentPage < attributedUsage.metadata.totalPages

  const loadMoreRows = (): void => {
    if (!attributedUsage) return

    fetchMoreUsage({
      variables: { page: attributedUsage.metadata.currentPage + 1 },
      updateQuery: (previous, { fetchMoreResult }) => ({
        attributedUsage: {
          ...previous.attributedUsage,
          metadata: fetchMoreResult.attributedUsage.metadata,
          rows: [...previous.attributedUsage.rows, ...fetchMoreResult.attributedUsage.rows],
        },
      }),
    })
  }
  const chargesUsage = attributedUsage?.totals.chargesUsage ?? []
  const { columns, hiddenColumnsCount } = buildAttributionColumns({
    chargesUsage,
    selectedChargeId: selectedCharge?.id ?? null,
    isExpanded,
  })

  const getTableRows = (): AttributionTableRow[] => {
    if (!attributedUsage) return []

    if (!listByType) {
      const customer = setupData?.subscription?.customer

      return [
        {
          id: 'customer',
          typeLabel: translate('text_65201c5a175a4b0238abf29a'),
          label: customer?.displayName ?? '',
          isUnattributed: false,
          amountCents: attributedUsage.totals.amountCents,
          chargesUsage: attributedUsage.totals.chargesUsage,
        },
      ]
    }

    return [
      ...attributedUsage.rows.map((row) => ({
        id: `value-${row.value}`,
        typeLabel: listByType.name || listByType.code,
        label: row.value,
        isUnattributed: false,
        amountCents: row.amountCents,
        chargesUsage: row.chargesUsage,
      })),
      {
        id: 'unattributed',
        typeLabel: translate('text_1792668632007lqi5wcqidcx'),
        label: translate('text_1792668632007qgsxnaul7fn', {
          typeName: listByType.name || listByType.code,
        }),
        isUnattributed: true,
        amountCents: attributedUsage.unattributed.amountCents,
        chargesUsage: attributedUsage.unattributed.chargesUsage,
      },
    ]
  }

  const renderErrorPlaceholder = (): JSX.Element => (
    <GenericPlaceholder
      title={translate('text_62c3f3fca8a1625624e83379')}
      subtitle={translate('text_1726498444629i1fpjyvh0kg')}
      buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
      buttonVariant="primary"
      buttonAction={refetch}
      image={<ErrorImage width="136" height="104" />}
    />
  )

  const renderTable = (): JSX.Element => {
    if (usageError) return renderErrorPlaceholder()

    return (
      <AttributionFlatTable
        rows={getTableRows()}
        totals={{
          amountCents: attributedUsage?.totals.amountCents,
          chargesUsage,
        }}
        columns={columns}
        chargeLabel={selectedCharge ? getAttributionChargeLabel(selectedCharge) : null}
        hiddenColumnsCount={hiddenColumnsCount}
        isExpanded={isExpanded}
        basis={basis}
        currency={attributedUsage?.currency ?? CurrencyEnum.Usd}
        isLoading={isUsageLoading}
        loadMore={
          hasMoreRows ? { isLoading: isFetchingMoreRows, onLoadMore: loadMoreRows } : undefined
        }
        onToggleExpanded={() => setIsExpanded((previous) => !previous)}
      />
    )
  }

  const renderContent = (): JSX.Element => {
    if (isSetupLoading) {
      return <Skeleton variant="text" className="w-60" />
    }

    if (setupError) return renderErrorPlaceholder()

    if (!groupBy) {
      return (
        <GenericPlaceholder
          title={translate('text_179266863200755rsgv48149')}
          subtitle={translate('text_1792668632007fg27a9tynot')}
          image={<EmptyImage width="136" height="104" />}
        />
      )
    }

    if (!isChargesLoading && !!chargesData && !charges.length) {
      return (
        <GenericPlaceholder
          title={translate('text_179266863200755rsgv48149')}
          subtitle={translate('text_17926699335793izsc0id302')}
          image={<EmptyImage width="136" height="104" />}
        />
      )
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-3">
          <AttributionToolbarSelect
            label={translate('text_1792668632005n1819nx39mn')}
            value={groupRowsBy}
            options={[
              {
                value: AttributionGroupByEnum.hierarchical,
                label: translate('text_1790230812563cibrddwcit4'),
              },
              {
                value: AttributionGroupByEnum.flat,
                label: translate('text_17902308125635bb6aqr2wbe'),
              },
            ]}
            onChange={(value) =>
              setGroupRowsBy(
                value === AttributionGroupByEnum.flat
                  ? AttributionGroupByEnum.flat
                  : AttributionGroupByEnum.hierarchical,
              )
            }
            data-test={ATTRIBUTION_GROUP_ROWS_BY_TEST_ID}
          />
          <AttributionToolbarSelect
            label={translate('text_1792668632006fudpouvembh')}
            value={listByType?.code ?? ALL_VALUE}
            searchPlaceholder={translate('text_17926686320073nuz7cm1rqx')}
            options={[
              { value: ALL_VALUE, label: translate('text_1792668632006b3qj9q83f0y') },
              ...flatTypes.map((type) => ({ value: type.code, label: type.name || type.code })),
            ]}
            onChange={(value) => setListByCode(value === ALL_VALUE ? null : value)}
            data-test={ATTRIBUTION_LIST_BY_TEST_ID}
          />
          <AttributionToolbarSelect
            label={translate('text_1768572142436xubwd6sei3b')}
            value={selectedCharge?.id ?? ALL_VALUE}
            searchPlaceholder={translate('text_1792668632007rt6bsw1fxv1')}
            options={[
              { value: ALL_VALUE, label: translate('text_1792668632006rpirkcifav7') },
              ...charges.map((charge) => ({
                value: charge.id,
                label: getAttributionChargeLabel(charge),
              })),
            ]}
            onChange={onChargeChange}
            data-test={ATTRIBUTION_CHARGES_TEST_ID}
          />
          <AttributionToolbarSelect
            label={translate('text_1792668632006md3w8ukpmda')}
            value={basis}
            options={[
              {
                value: AttributedUsageBasisEnum.Amount,
                label: translate('text_17926686320060zkco8pmwgt'),
                disabled: !isAmountAvailable,
              },
              {
                value: AttributedUsageBasisEnum.Units,
                label: translate('text_65771fa3f4ab9a00720726ce'),
              },
            ]}
            onChange={(value) =>
              setBasis(
                value === AttributedUsageBasisEnum.Amount
                  ? AttributedUsageBasisEnum.Amount
                  : AttributedUsageBasisEnum.Units,
              )
            }
            data-test={ATTRIBUTION_SHOW_TEST_ID}
          />
        </div>

        {renderTable()}
      </>
    )
  }

  return (
    <section className="flex flex-col gap-6 pt-6">
      <div className="flex items-center justify-between">
        <Typography variant="subhead1" color="grey700">
          {translate('text_179266863200554b244nyt8i')}
        </Typography>
        <Button
          variant="inline"
          size="small"
          disabled={isSetupLoading || isUsageLoading}
          onClick={refetch}
          data-test={ATTRIBUTION_REFRESH_BUTTON_TEST_ID}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </div>

      {renderContent()}
    </section>
  )
}
