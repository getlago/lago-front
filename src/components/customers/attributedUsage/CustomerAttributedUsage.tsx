import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import {
  AttributedUsageBasisEnum,
  CurrencyEnum,
  UsageAttributionTypeRoleEnum,
  useGetAttributedUsageQuery,
  useGetAttributedUsageSetupQuery,
} from '~/generated/graphql'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

import {
  AttributedUsageView,
  AttributedUsageViewProvider,
  useLevelVariables,
} from './AttributedUsageContext'
import { FlatLevel, HierarchyLevel } from './AttributedUsageLevel'
import { UsageCells, UsageRow } from './AttributedUsageRows'
import {
  ChargesPicker,
  FilterBar,
  PeriodPicker,
  PopperHandle,
  Segmented,
  ToolbarButton,
  ToolbarDivider,
  ToolbarLabel,
} from './AttributedUsageToolbar'
import {
  AttributionType,
  buildColumnGroups,
  ColumnGroup,
  columnWidth,
  countDays,
  formatAmountCents,
  formatCount,
  formatRange,
  isAttributableCharge,
  isQueryLimitError,
  LEVEL_PAGE_SIZE,
  MAX_SELECTED_CHARGES,
  Period,
  periodDatetimes,
  PeriodKindEnum,
  PlanCharge,
  previousPeriodRange,
  ScopeFilter,
  TOTAL_COLUMN_WIDTH,
  typeLabel,
} from './utils'

gql`
  query getAttributedUsageSetup($externalCustomerId: String!) {
    subscriptions(externalCustomerId: $externalCustomerId, status: [active], limit: 50) {
      collection {
        id
        externalId
        name
        startedAt
        currentBillingPeriodStartedAt
        currentBillingPeriodEndingAt
        plan {
          id
          name
          code
          interval
          amountCurrency
          charges {
            id
            invoiceDisplayName
            chargeModel
            billableMetric {
              id
              name
              code
              aggregationType
              recurring
            }
            filters {
              id
              invoiceDisplayName
              values
            }
          }
        }
      }
    }
    usageAttributionTypes(limit: 100) {
      collection {
        id
        code
        name
        role
        parent {
          id
        }
      }
    }
  }
`

const NO_GROUPING = 'none'

type CustomerAttributedUsageProps = {
  customerExternalId: string
  customerName: string
  // Set on the subscription details page: the view is locked to that subscription.
  fixedSubscriptionId?: string
}

const KpiCard = ({
  title,
  value,
  subtitle,
}: {
  title: string
  value: ReactNode
  subtitle: ReactNode
}): JSX.Element => (
  <div className="rounded-xl border border-grey-300 bg-white px-5 py-4">
    <div className="text-xs font-medium text-grey-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold tracking-tight text-grey-700">{value}</div>
    <div className="mt-1 text-xs text-grey-500">{subtitle}</div>
  </div>
)

const EntityChip = ({ code, dashed }: { code: string; dashed?: boolean }): JSX.Element => (
  <span
    className={tw(
      'font-mono rounded-lg border bg-white px-2 py-0.5 text-[11px] leading-[18px]',
      dashed ? 'border-dashed border-grey-400' : 'border-grey-300',
    )}
  >
    {code}
  </span>
)

const TableHeader = ({
  rowHeader,
  columnGroups,
  basis,
  splitChargeId,
  onToggleSplit,
}: {
  rowHeader: string
  columnGroups: ColumnGroup[]
  basis: AttributedUsageBasisEnum
  splitChargeId?: string
  onToggleSplit: (chargeId: string) => void
}): JSX.Element => {
  const renderSplitControl = (group: ColumnGroup): ReactNode => {
    if (group.unitsOnly) {
      return (
        <span
          title="Amount not available for this pricing model"
          className="flex items-center gap-1.5 text-[11px] font-medium leading-4 text-grey-500"
        >
          Units only
          <Icon name="info-circle" size="small" color="input" />
        </span>
      )
    }

    if (group.splitBlockedReason) {
      return (
        <span
          title={group.splitBlockedReason}
          className="flex cursor-not-allowed items-center gap-1.5 text-[11px] font-medium leading-4 text-grey-400"
        >
          Split by filter
          <span className="relative h-4 w-[26px] rounded-full bg-grey-200">
            <span className="absolute left-0.5 top-0.5 size-3 rounded-full bg-grey-100" />
          </span>
          <Icon name="info-circle" size="small" color="input" />
        </span>
      )
    }

    if (!group.canSplit) return null

    const on = splitChargeId === group.charge.id

    return (
      <button
        type="button"
        onClick={() => onToggleSplit(group.charge.id)}
        className="flex items-center gap-1.5"
      >
        <span
          className={tw(
            'whitespace-nowrap text-[11px] font-medium leading-4',
            on ? 'text-blue-700' : 'text-grey-600',
          )}
        >
          Split by filter
        </span>
        <span
          className={tw('relative h-4 w-[26px] rounded-full', on ? 'bg-blue-600' : 'bg-grey-300')}
        >
          <span
            className={tw(
              'absolute top-0.5 size-3 rounded-full bg-white shadow-[0_1px_2px_rgba(25,33,46,0.2)]',
              on ? 'left-3' : 'left-0.5',
            )}
          />
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-stretch rounded-t-xl bg-grey-100 shadow-[inset_0_-1px_0_0_#D9DEE7]">
      <div className="flex min-w-56 flex-1 items-end px-4 py-2.5 text-xs font-medium text-grey-500">
        {rowHeader}
      </div>
      {columnGroups.map((group) => (
        <div
          key={group.charge.id}
          className="flex shrink-0 flex-col justify-between border-l border-grey-300"
          style={{ width: columnWidth(group) * group.columns.length + 1 }}
        >
          <div className="flex flex-col items-end gap-1 px-3 py-2">
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-grey-700">
              {group.label}
            </span>
            {renderSplitControl(group)}
          </div>
          {group.split && (
            <div className="flex shadow-[inset_0_1px_0_0_#E7EAEE]">
              {group.columns.map((column) => (
                <div
                  key={column.key}
                  title={column.label}
                  style={{ width: columnWidth(group) }}
                  className={tw(
                    'font-mono shrink-0 truncate px-2.5 py-1.5 text-right text-[11px] leading-4',
                    column.isDefault ? 'text-grey-500' : 'text-grey-600',
                  )}
                >
                  {column.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div
        className="flex shrink-0 flex-col items-end justify-end border-l border-grey-300 px-4 py-2.5"
        style={{ width: TOTAL_COLUMN_WIDTH }}
      >
        <span className="text-xs font-semibold text-grey-700">Total</span>
        <span className="text-[11px] leading-4 text-grey-500">
          {basis === AttributedUsageBasisEnum.Amount ? 'per-unit charges' : 'events'}
        </span>
      </div>
    </div>
  )
}

// The totals of the whole view: the first page of the top level, which the table's own top level
// shares through the Apollo cache.
const ViewTotals = ({
  groupBy,
  children,
}: {
  groupBy: AttributionType
  children: (result: ReturnType<typeof useGetAttributedUsageQuery>) => JSX.Element
}): JSX.Element => {
  const variables = useLevelVariables({
    groupBy: groupBy.code,
    scope: [],
    page: 1,
    limit: LEVEL_PAGE_SIZE,
  })
  const result = useGetAttributedUsageQuery({
    variables,
    context: { silentError: true },
    notifyOnNetworkStatusChange: true,
  })

  return children(result)
}

export const CustomerAttributedUsage = ({
  customerExternalId,
  customerName,
  fixedSubscriptionId,
}: CustomerAttributedUsageProps): JSX.Element => {
  const { data, loading, error } = useGetAttributedUsageSetupQuery({
    variables: { externalCustomerId: customerExternalId },
    skip: !customerExternalId,
  })

  const subscriptions = useMemo(() => data?.subscriptions.collection ?? [], [data])
  const types = useMemo<AttributionType[]>(
    () => data?.usageAttributionTypes.collection ?? [],
    [data],
  )

  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [period, setPeriod] = useState<Period>({ kind: PeriodKindEnum.current })
  const [groupBy, setGroupBy] = useState<string>()
  const [listBy, setListBy] = useState<string>(NO_GROUPING)
  const [basis, setBasis] = useState(AttributedUsageBasisEnum.Amount)
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>()
  const [splitChargeId, setSplitChargeId] = useState<string>()
  const [flatFilters, setFlatFilters] = useState<ScopeFilter[]>([])
  const [accountExpanded, setAccountExpanded] = useState(false)

  const periodRef = useRef<PopperHandle>(null)
  const chargesRef = useRef<PopperHandle>(null)
  const filterRef = useRef<PopperHandle>(null)

  const subscription =
    subscriptions.find((item) => item.id === (fixedSubscriptionId ?? subscriptionId)) ??
    subscriptions[0]
  const planCharges = useMemo<PlanCharge[]>(() => subscription?.plan.charges ?? [], [subscription])
  const attributableCharges = planCharges.filter(isAttributableCharge)
  const chargeIds =
    selectedChargeIds ??
    attributableCharges.slice(0, MAX_SELECTED_CHARGES).map((charge) => charge.id)
  const selectedCharges = attributableCharges.filter((charge) => chargeIds.includes(charge.id))

  const hierarchicalRoots = types.filter(
    (type) => type.role === UsageAttributionTypeRoleEnum.Hierarchical && !type.parent,
  )
  const flatTypes = types.filter((type) => type.role === UsageAttributionTypeRoleEnum.Flat)
  const childTypeOf = useCallback(
    (type: AttributionType): AttributionType | undefined =>
      types.find(
        (item) =>
          item.role === UsageAttributionTypeRoleEnum.Hierarchical && item.parent?.id === type.id,
      ),
    [types],
  )
  const chainOf = (root?: AttributionType): AttributionType[] => {
    const chain: AttributionType[] = []
    let current = root

    while (current && chain.length < 10) {
      chain.push(current)
      current = childTypeOf(current)
    }

    return chain
  }

  const groupRoot =
    groupBy === NO_GROUPING
      ? undefined
      : (hierarchicalRoots.find((type) => type.code === groupBy) ?? hierarchicalRoots[0])
  const listType = flatTypes.find((type) => type.code === listBy)
  const totalsType = groupRoot ?? listType ?? hierarchicalRoots[0] ?? flatTypes[0]

  const columnGroups = buildColumnGroups({ charges: selectedCharges, splitChargeId, basis })
  const datetimes = periodDatetimes(period, subscription ?? undefined)
  const previousRange = previousPeriodRange(subscription ?? undefined)
  const currency = (subscription?.plan.amountCurrency ?? CurrencyEnum.Usd) as CurrencyEnum

  const view: AttributedUsageView = {
    subscriptionId: subscription?.id ?? '',
    customerName,
    currency,
    basis,
    ...datetimes,
    chargeIds,
    splitChargeId,
    flatFilters,
    listBy: listType,
    columnGroups,
    childTypeOf,
  }

  const resetView = (): void => {
    setAccountExpanded(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-grey-100" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-grey-100" />
      </div>
    )
  }

  if (error) {
    return (
      <GenericPlaceholder
        title="Attributed usage could not be loaded"
        subtitle="Refresh the page or try again later."
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  if (!subscription || !totalsType) {
    return (
      <GenericPlaceholder
        title={!subscription ? 'No active subscription' : 'No usage attribution type'}
        subtitle={
          !subscription
            ? 'Attributed usage is read per active subscription.'
            : 'Configure the entities in Settings › Usage governance to break usage down.'
        }
        image={<EmptyImage width="136" height="104" />}
      />
    )
  }

  const hierarchy = chainOf(groupRoot ?? hierarchicalRoots[0])
  const rowHeader = [
    groupRoot ? chainOf(groupRoot).map(typeLabel).join(' · ') : 'Account',
    ...(listType ? [typeLabel(listType)] : []),
  ].join(' · ')
  const showAccountRow = !!listType || !groupRoot

  const toggleCharge = (chargeId: string): void => {
    const next = chargeIds.includes(chargeId)
      ? chargeIds.filter((id) => id !== chargeId)
      : [...chargeIds, chargeId]

    setSelectedChargeIds(next)
    if (splitChargeId && !next.includes(splitChargeId)) setSplitChargeId(undefined)
  }

  return (
    <AttributedUsageViewProvider value={view}>
      <ViewTotals groupBy={totalsType}>
        {({ data: totalsData, loading: totalsLoading, error: totalsError }) => {
          const usage = totalsData?.attributedUsage
          const totals = usage?.totals
          const unattributed = usage?.unattributed
          const rangeLabel = formatRange(usage?.fromDatetime, usage?.toDatetime)
          const periodDays =
            usage?.fromDatetime && usage?.toDatetime
              ? countDays(usage.fromDatetime.slice(0, 10), usage.toDatetime.slice(0, 10))
              : undefined
          const isAmount = basis === AttributedUsageBasisEnum.Amount
          const tooLarge = isQueryLimitError(totalsError)

          const kpiValue = (aggregate?: typeof totals): string => {
            if (!aggregate) return '—'
            if (isAmount) return formatAmountCents(aggregate.preciseAmountCents ?? 0, currency)

            return `${formatCount(aggregate.eventsCount)} events`
          }
          const share = (): string => {
            if (!totals || !unattributed) return ''

            const total = isAmount ? (totals.preciseAmountCents ?? 0) : totals.eventsCount
            const part = isAmount
              ? (unattributed.preciseAmountCents ?? 0)
              : unattributed.eventsCount

            return total
              ? `${Math.round((part / total) * 100)}% of attributed usage`
              : 'No usage yet'
          }

          const renderTable = (): ReactNode => {
            if (tooLarge) {
              return (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-grey-300 px-6 py-12 text-center">
                  <ErrorImage width="120" height="104" />
                  <h4 className="text-base font-semibold tracking-tight text-grey-700">
                    This view is too large
                  </h4>
                  <p className="max-w-[440px] text-sm text-grey-600">
                    Narrow it with a filter, a shorter period, or fewer charges.
                  </p>
                  <div className="mt-1 flex gap-2">
                    {!!flatTypes.length && (
                      <ToolbarButton onClick={() => filterRef.current?.openPopper()}>
                        Add filter
                      </ToolbarButton>
                    )}
                    <ToolbarButton onClick={() => periodRef.current?.openPopper()}>
                      Shorten period
                    </ToolbarButton>
                    <ToolbarButton onClick={() => chargesRef.current?.openPopper()}>
                      Choose charges
                    </ToolbarButton>
                  </div>
                  <span className="text-[11px] leading-4 text-grey-500">
                    {groupRoot
                      ? `${typeLabel(totalsType)} level`
                      : `${typeLabel(totalsType)} across the account`}{' '}
                    · {selectedCharges.length} charges
                    {periodDays ? ` · ${periodDays} days` : ''}
                  </span>
                </div>
              )
            }

            if (!selectedCharges.length) {
              return (
                <GenericPlaceholder
                  title="No attributable charge"
                  subtitle="Only count and sum charges can be attributed to entities."
                  image={<EmptyImage width="136" height="104" />}
                />
              )
            }

            return (
              <>
                <div className="overflow-x-auto rounded-xl border border-grey-300 bg-white">
                  <div className="min-w-fit">
                    <TableHeader
                      rowHeader={rowHeader}
                      columnGroups={columnGroups}
                      basis={basis}
                      splitChargeId={splitChargeId}
                      onToggleSplit={(chargeId) =>
                        setSplitChargeId((current) => (current === chargeId ? undefined : chargeId))
                      }
                    />
                    {showAccountRow && (
                      <>
                        <UsageRow
                          label={customerName}
                          typeLabel={listType ? `account · list ${typeLabel(listType)}` : 'account'}
                          depth={0}
                          aggregate={totals}
                          labelVariant="strong"
                          expandable={!!listType}
                          expanded={accountExpanded}
                          onToggle={() => setAccountExpanded((value) => !value)}
                        />
                        {accountExpanded && listType && (
                          <FlatLevel groupBy={listType} scope={[]} depth={1} />
                        )}
                      </>
                    )}
                    {groupRoot && <HierarchyLevel groupBy={groupRoot} scope={[]} depth={0} />}
                    <div className="flex items-stretch rounded-b-xl bg-grey-100">
                      <div className="flex min-w-56 flex-1 items-center px-4 text-xs font-semibold text-grey-700">
                        Attributed total
                      </div>
                      {totalsLoading && !totals ? (
                        <div className="flex-1" />
                      ) : (
                        <UsageCells aggregate={totals} emphasized />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <Icon name="info-circle" size="small" color="input" className="mt-0.5" />
                    <span className="text-xs text-grey-600">
                      Excludes charges that cannot be attributed. See the Usage tab for invoice
                      totals.
                    </span>
                  </div>
                  <span className="pl-6 text-xs text-grey-500">
                    Each level loads on expand: {LEVEL_PAGE_SIZE} rows per page, ordered by{' '}
                    {isAmount ? 'amount' : 'events'}. Grey rows hold usage sent without that level.
                    {listType
                      ? ` ${typeLabel(listType)} rows load under one node at a time — top 5, then Show more.`
                      : ''}
                  </span>
                </div>
              </>
            )
          }

          return (
            <div className="flex flex-col gap-5 pb-12">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <KpiCard
                  title="Attributed usage"
                  value={kpiValue(totals)}
                  subtitle={`${isAmount ? 'Per-unit charges' : 'All selected charges'} · ${rangeLabel}`}
                />
                <KpiCard
                  title={`Not attributed to a ${typeLabel(totalsType).toLowerCase()}`}
                  value={kpiValue(unattributed)}
                  subtitle={share()}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {!fixedSubscriptionId && (
                    <>
                      <div className="flex items-center gap-2">
                        <ToolbarLabel>Subscription</ToolbarLabel>
                        <div className="relative flex items-center">
                          <select
                            value={subscription.id}
                            onChange={(event) => {
                              setSubscriptionId(event.target.value)
                              setSelectedChargeIds(undefined)
                              setSplitChargeId(undefined)
                              resetView()
                            }}
                            className="appearance-none rounded-lg border border-grey-300 bg-white py-1 pl-2.5 pr-7 text-xs font-medium text-grey-700"
                          >
                            {subscriptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {[item.name || item.plan.name, item.externalId].join(' · ')}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-2 flex">
                            <Icon name="chevron-down" size="small" color="dark" />
                          </span>
                        </div>
                      </div>
                      <ToolbarDivider />
                    </>
                  )}
                  <PeriodPicker
                    popperRef={periodRef}
                    period={period}
                    onApply={setPeriod}
                    rangeLabel={rangeLabel}
                    currentRangeLabel={formatRange(
                      subscription.currentBillingPeriodStartedAt,
                      subscription.currentBillingPeriodEndingAt,
                    )}
                    previousRangeLabel={
                      previousRange
                        ? formatRange(previousRange.from, previousRange.to.minus({ days: 1 }))
                        : undefined
                    }
                    subscriptionStartedAt={subscription.startedAt}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-grey-300 bg-grey-100 px-3.5 py-2.5">
                  <span className="mr-1 text-xs font-medium text-grey-500">Entities</span>
                  {hierarchy.map((type, index) => (
                    <span key={type.id} className="flex items-center gap-2">
                      {index > 0 && <Icon name="chevron-right" size="small" color="disabled" />}
                      <EntityChip code={type.code} />
                    </span>
                  ))}
                  {!!hierarchy.length && (
                    <span className="text-[11px] leading-4 text-grey-500">
                      hierarchical · drill down
                    </span>
                  )}
                  {!!hierarchy.length && !!flatTypes.length && (
                    <div className="mx-1.5 h-[18px] w-px bg-grey-300" />
                  )}
                  {flatTypes.map((type) => (
                    <EntityChip key={type.id} code={type.code} dashed />
                  ))}
                  {!!flatTypes.length && (
                    <span className="text-[11px] leading-4 text-grey-500">
                      flat · list or filter
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ToolbarLabel>Group rows by</ToolbarLabel>
                  <Segmented
                    options={[
                      ...hierarchicalRoots.map((type) => ({
                        value: type.code,
                        label: hierarchicalRoots.length > 1 ? typeLabel(type) : 'Hierarchy',
                      })),
                      { value: NO_GROUPING, label: 'Nothing' },
                    ]}
                    value={groupRoot?.code ?? NO_GROUPING}
                    onChange={(value) => {
                      setGroupBy(value)
                      resetView()
                    }}
                  />
                  {!!flatTypes.length && (
                    <>
                      <ToolbarDivider />
                      <ToolbarLabel>List by</ToolbarLabel>
                      <Segmented
                        options={[
                          { value: NO_GROUPING, label: 'Nothing' },
                          ...flatTypes.map((type) => ({
                            value: type.code,
                            label: typeLabel(type),
                          })),
                        ]}
                        value={listType?.code ?? NO_GROUPING}
                        onChange={(value) => {
                          setListBy(value)
                          resetView()
                        }}
                      />
                    </>
                  )}
                  <ToolbarDivider />
                  <ToolbarLabel>Show</ToolbarLabel>
                  <Segmented
                    options={[
                      { value: AttributedUsageBasisEnum.Amount, label: 'Amount' },
                      { value: AttributedUsageBasisEnum.Units, label: 'Units' },
                    ]}
                    value={basis}
                    onChange={setBasis}
                  />
                  <ToolbarDivider />
                  <ChargesPicker
                    popperRef={chargesRef}
                    charges={planCharges}
                    selectedIds={chargeIds}
                    onToggle={toggleCharge}
                  />
                </div>

                <FilterBar
                  popperRef={filterRef}
                  flatTypes={flatTypes}
                  filters={flatFilters}
                  onChange={setFlatFilters}
                  subscriptionId={subscription.id}
                  {...datetimes}
                />

                {renderTable()}
              </div>
            </div>
          )
        }}
      </ViewTotals>
    </AttributedUsageViewProvider>
  )
}
