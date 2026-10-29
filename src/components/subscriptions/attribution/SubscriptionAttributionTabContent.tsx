import { gql } from '@apollo/client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { Filters } from '~/components/Filters'
import {
  AttributedUsageBasisEnum,
  CurrencyEnum,
  useGetSubscriptionAttributionChargesQuery,
  useGetSubscriptionAttributionSetupQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

import { buildAttributionDynamicFilters } from './AttributionFilterInputs'
import {
  ATTRIBUTION_FILTERS_PREFIX,
  ATTRIBUTION_TIME_RANGE_FILTER_KEY,
  AttributionTimeRangeEnum,
  getAttributionEntityFilters,
  getAttributionTimeRangeArgs,
  getAttributionTimeRangeValue,
  isAttributionGuardError,
} from './attributionFilters'
import {
  AttributionFlatTable,
  AttributionShowMoreColumns,
  AttributionTableRow,
} from './AttributionFlatTable'
import { AttributionToolbarSelect } from './AttributionToolbarSelect'
import {
  buildAttributionHierarchy,
  flattenAttributionHierarchyTypes,
  getAttributionChildLevels,
  getAttributionNodeKey,
  getDeepestAttributionHierarchyType,
} from './attributionTree'
import { AttributionTreeTable } from './AttributionTreeTable'
import {
  AttributionGroupByEnum,
  buildAttributionColumns,
  getAttributionChargeLabel,
  getAttributionRowsChargesUsage,
  isAttributionAmountAvailable,
  mergeAttributionChargesUsage,
  SPLIT_FILTERS_PER_PAGE,
} from './buildAttributionColumns'
import { isAttributionTreeBusy, useAttributionTree } from './useAttributionTree'

export const ATTRIBUTION_REFRESH_BUTTON_TEST_ID = 'attribution-refresh-button'
export const ATTRIBUTION_GROUP_ROWS_BY_TEST_ID = 'attribution-group-rows-by'
export const ATTRIBUTION_LIST_BY_TEST_ID = 'attribution-list-by'
export const ATTRIBUTION_UNDER_TEST_ID = 'attribution-under'
export const ATTRIBUTION_CHARGES_TEST_ID = 'attribution-charges'
export const ATTRIBUTION_SHOW_TEST_ID = 'attribution-show'

// Empty because `UsageAttributionType` validates `code` presence: no type can ever use it.
const ALL_VALUE = ''
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
      startedAt
      currentBillingPeriodStartedAt
      plan {
        id
        interval
      }
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
    hierarchicalAttributionTypes: usageAttributionTypes(role: hierarchical, limit: $limit) {
      collection {
        id
        code
        name
        parent {
          id
        }
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
    $filters: [AttributedUsageFilterInput!]
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
    $page: Int
    $limit: Int
    $splitFiltersOffset: Int
  ) {
    attributedUsage(
      subscriptionId: $subscriptionId
      groupBy: $groupBy
      basis: $basis
      chargeIds: $chargeIds
      splitChargeId: $splitChargeId
      filters: $filters
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
      page: $page
      limit: $limit
      splitFiltersOffset: $splitFiltersOffset
    ) {
      currency
      splitFiltersCount
      metadata {
        currentPage
        totalPages
      }
      rows {
        value
        amountCents
        splitChargeUnits
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
      unattributed {
        amountCents
        splitChargeUnits
        chargesUsage {
          ...AttributionChargeUsage
        }
      }
      totals {
        amountCents
        splitChargeUnits
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
  const [searchParams] = useSearchParams()

  const [groupRowsBy, setGroupRowsBy] = useState<AttributionGroupByEnum>(
    AttributionGroupByEnum.hierarchical,
  )
  const [listByCode, setListByCode] = useState<string | null>(null)
  const [underCode, setUnderCode] = useState<string | null>(null)
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null)
  const [basis, setBasis] = useState<AttributedUsageBasisEnum>(AttributedUsageBasisEnum.Units)
  const [expandedResetKey, setExpandedResetKey] = useState<string | null>(null)

  const {
    data: setupData,
    loading: isSetupLoading,
    error: setupError,
    refetch: refetchSetup,
  } = useGetSubscriptionAttributionSetupQuery({
    variables: { subscriptionId, limit: ATTRIBUTION_TYPES_LIMIT },
    skip: !subscriptionId,
    fetchPolicy: 'network-only',
    context: { silentError: true },
  })

  const flatTypes = setupData?.flatAttributionTypes.collection ?? []
  const rootTypes = useMemo(
    () => buildAttributionHierarchy(setupData?.hierarchicalAttributionTypes.collection ?? []),
    [setupData?.hierarchicalAttributionTypes.collection],
  )
  const hierarchy = useMemo(() => {
    const flattened = flattenAttributionHierarchyTypes(rootTypes)

    return {
      types: flattened.map(({ type }) => type),
      deepestType: getDeepestAttributionHierarchyType(rootTypes),
      signature: flattened.map(({ type, depth }) => `${depth}:${type.id}`).join('|'),
    }
  }, [rootTypes])
  const subscription = setupData?.subscription

  const dynamicFilters = useMemo(
    () =>
      buildAttributionDynamicFilters({
        translate,
        subscriptionId,
        subscription,
        flatTypes: setupData?.flatAttributionTypes.collection ?? [],
        hierarchicalTypes: hierarchy.types,
        rootTypes,
      }),
    [
      hierarchy.types,
      rootTypes,
      setupData?.flatAttributionTypes.collection,
      subscription,
      subscriptionId,
      translate,
    ],
  )

  const timeRangeArgs = getAttributionTimeRangeArgs({
    value: getAttributionTimeRangeValue(searchParams),
    subscription,
  })
  const entityFilters = getAttributionEntityFilters({
    searchParams,
    codes: [...flatTypes, ...hierarchy.types].map(({ code }) => code),
  })

  const listByType = flatTypes.find((type) => type.code === listByCode)
  const fallbackGroupBy = flatTypes[0]?.code ?? rootTypes[0]?.code ?? ''
  const groupBy = listByType?.code ?? fallbackGroupBy
  const hasHierarchy = !!rootTypes.length
  const displayedGroupRowsBy = hasHierarchy ? groupRowsBy : AttributionGroupByEnum.flat
  const isTreeMode = displayedGroupRowsBy === AttributionGroupByEnum.hierarchical
  const underType = hierarchy.types.find((type) => type.code === underCode) ?? hierarchy.deepestType
  const treeListBy =
    listByType && underType ? { flatType: listByType, underCode: underType.code } : null

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

  const treeVariables = {
    subscriptionId,
    basis,
    chargeIds: selectedCharge ? [selectedCharge.id] : undefined,
    splitChargeId: selectedCharge?.filters?.length ? selectedCharge.id : undefined,
    filters: entityFilters.length ? entityFilters : undefined,
    ...timeRangeArgs,
    limit: ATTRIBUTION_ROWS_LIMIT,
  }

  const treeResetKey = JSON.stringify({
    ...treeVariables,
    isTreeMode,
    groupBy,
    listByCode: listByType?.code,
    listBy: treeListBy,
    hierarchy: hierarchy.signature,
  })
  const isExpanded = expandedResetKey === treeResetKey

  useEffect(() => {
    setExpandedResetKey(null)
  }, [treeResetKey])

  const {
    nodes: treeNodes,
    isLoadingFilterPage,
    toggleNode,
    loadMore: loadMoreTreeRows,
    loadMoreFilterPage,
    refresh: refreshTree,
  } = useAttributionTree({
    variables: treeVariables,
    getChildLevels: (parentCode) => {
      if (isTreeMode) {
        return getAttributionChildLevels({ roots: rootTypes, parentCode, listBy: treeListBy })
      }

      if (parentCode) return []

      return [{ code: groupBy, name: listByType?.name || groupBy, isLeaf: true }]
    },
    resetKey: treeResetKey,
    skip: !groupBy,
  })
  const treeRootNode = treeNodes[getAttributionNodeKey([])]
  const treeRootBlocks = treeRootNode?.status === 'loaded' ? treeRootNode.blocks : []
  const isTreeLoading = !!groupBy && (!treeRootNode || treeRootNode.status === 'loading')
  const rootBlock = treeRootBlocks[0]
  const rootUsage = rootBlock?.usages[0]
  const isTreeBusy = isAttributionTreeBusy(treeNodes)

  const isAmountAvailable = isAttributionAmountAvailable(
    selectedCharge ? [selectedCharge] : charges,
  )

  const refetch = (): void => {
    refetchSetup()

    if (!groupBy) return

    refetchCharges()

    refreshTree()
  }

  const onChargeChange = (value: string): void => {
    const nextCharge = charges.find((charge) => charge.id === value)

    setSelectedChargeId(nextCharge?.id ?? null)

    if (!isAttributionAmountAvailable(nextCharge ? [nextCharge] : charges)) {
      setBasis(AttributedUsageBasisEnum.Units)
    }
  }

  const hasMoreRows =
    !!listByType && !!rootUsage && rootUsage.metadata.currentPage < rootUsage.metadata.totalPages

  // Not `treeRootBlocks[0]` alone: every root block totals the same usage under a different
  // groupBy, so a charge missing from one of them would drop its column.
  const loadedFilterPagesCount = Math.max(1, ...treeRootBlocks.map(({ usages }) => usages.length))
  const chargesUsageByFilterPage = Array.from({ length: loadedFilterPagesCount }, (_, filterPage) =>
    mergeAttributionChargesUsage(
      treeRootBlocks.map(({ usages }) => usages[filterPage]?.totals.chargesUsage ?? []),
    ),
  )
  const { columns, hiddenColumnsCount } = buildAttributionColumns({
    chargesUsageByFilterPage,
    selectedChargeId: selectedCharge?.id ?? null,
    isExpanded,
  })
  const hasMoreFilterPages =
    isExpanded &&
    (rootUsage?.splitFiltersCount ?? 0) > chargesUsageByFilterPage.length * SPLIT_FILTERS_PER_PAGE

  const getTableRows = (): AttributionTableRow[] => {
    if (!rootBlock || !rootUsage) return []

    if (!listByType) {
      const customer = setupData?.subscription?.customer

      return [
        {
          id: 'customer',
          typeLabel: translate('text_65201c5a175a4b0238abf29a'),
          label: customer?.displayName ?? '',
          isUnattributed: false,
          amountCents: rootUsage.totals.amountCents,
          splitChargeUnits: rootUsage.totals.splitChargeUnits,
          chargesUsageByFilterPage: rootBlock.usages.map(({ totals }) => totals.chargesUsage),
        },
      ]
    }

    const getRowChargesUsage = getAttributionRowsChargesUsage(rootBlock.usages)

    return [
      ...rootUsage.rows.map((row) => ({
        id: `value-${row.value}`,
        typeLabel: listByType.name || listByType.code,
        label: row.value,
        isUnattributed: false,
        amountCents: row.amountCents,
        splitChargeUnits: row.splitChargeUnits,
        chargesUsageByFilterPage: getRowChargesUsage(row.value),
      })),
      {
        id: 'unattributed',
        typeLabel: translate('text_1792668632007lqi5wcqidcx'),
        label: translate('text_1792668632007qgsxnaul7fn', {
          typeName: listByType.name || listByType.code,
        }),
        isUnattributed: true,
        amountCents: rootUsage.unattributed.amountCents,
        splitChargeUnits: rootUsage.unattributed.splitChargeUnits,
        chargesUsageByFilterPage: rootBlock.usages.map(
          ({ unattributed }) => unattributed.chargesUsage,
        ),
      },
    ]
  }

  const getShowMoreColumns = (): AttributionShowMoreColumns | undefined => {
    if (!isExpanded) {
      if (!hiddenColumnsCount) return undefined

      return { isExpanded: false, onClick: () => setExpandedResetKey(treeResetKey) }
    }

    if (!hasMoreFilterPages) return undefined

    return {
      isExpanded: true,
      isLoading: isLoadingFilterPage,
      isDisabled: isTreeBusy,
      onClick: loadMoreFilterPage,
    }
  }

  const renderErrorPlaceholder = (error?: unknown): JSX.Element => {
    const isGuardError = isAttributionGuardError(error)

    return (
      <GenericPlaceholder
        title={translate(
          isGuardError ? 'text_1792764705907n0lq6q75y89' : 'text_62c3f3fca8a1625624e83379',
        )}
        subtitle={translate(
          isGuardError ? 'text_17927647059078e1835hd0k1' : 'text_1726498444629i1fpjyvh0kg',
        )}
        buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
        buttonVariant="primary"
        buttonAction={refetch}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  const tableProps = {
    totals: {
      amountCents: rootUsage?.totals.amountCents,
      splitChargeUnits: rootUsage?.totals.splitChargeUnits,
      chargesUsageByFilterPage,
    },
    columns,
    chargeLabel: selectedCharge ? getAttributionChargeLabel(selectedCharge) : null,
    showMoreColumns: getShowMoreColumns(),
    basis,
    currency: rootUsage?.currency ?? CurrencyEnum.Usd,
  }

  const renderTable = (): JSX.Element => {
    if (treeRootNode?.status === 'error') return renderErrorPlaceholder(treeRootNode.error)

    if (isTreeMode) {
      return (
        <AttributionTreeTable
          {...tableProps}
          nodes={treeNodes}
          isLoading={isTreeLoading}
          isLoadingFilterPage={isLoadingFilterPage}
          onToggleNode={toggleNode}
          onLoadMore={loadMoreTreeRows}
        />
      )
    }

    return (
      <AttributionFlatTable
        {...tableProps}
        rows={getTableRows()}
        isLoading={isTreeLoading}
        loadMore={
          hasMoreRows
            ? {
                isLoading: !!rootBlock?.isLoadingMore || isLoadingFilterPage,
                onLoadMore: () => loadMoreTreeRows([], 0),
              }
            : undefined
        }
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
            value={displayedGroupRowsBy}
            options={[
              {
                value: AttributionGroupByEnum.hierarchical,
                label: translate('text_1790230812563cibrddwcit4'),
                disabled: !hasHierarchy,
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
            onChange={(value) => {
              setListByCode(value === ALL_VALUE ? null : value)
              setUnderCode(null)
            }}
            data-test={ATTRIBUTION_LIST_BY_TEST_ID}
          />
          {isTreeMode && !!treeListBy && (
            <AttributionToolbarSelect
              label={translate('text_1792683187186aqk8vde7x8t')}
              value={treeListBy.underCode}
              searchPlaceholder={translate('text_1792683187186qacr0y860nr')}
              options={hierarchy.types.map((type) => ({
                value: type.code,
                label: type.name || type.code,
              }))}
              onChange={setUnderCode}
              data-test={ATTRIBUTION_UNDER_TEST_ID}
            />
          )}
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

        <Filters.Provider
          filtersNamePrefix={ATTRIBUTION_FILTERS_PREFIX}
          availableFilters={[]}
          dynamicFilters={dynamicFilters}
          staticFilters={{ [ATTRIBUTION_TIME_RANGE_FILTER_KEY]: AttributionTimeRangeEnum.current }}
          showStaticFiltersRemoveButton
        >
          <Filters.Component />
        </Filters.Provider>

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
          disabled={isSetupLoading || isTreeBusy || isLoadingFilterPage}
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
