import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useState } from 'react'

import { useGetAttributedUsageQuery } from '~/generated/graphql'

import { useAttributedUsageView, useLevelVariables } from './AttributedUsageContext'
import { indentOf, MessageRow, MoreRow, SkeletonRows, UsageRow } from './AttributedUsageRows'
import {
  AttributionType,
  FLAT_PAGE_SIZE,
  formatCount,
  isQueryLimitError,
  LEVEL_PAGE_SIZE,
  ScopeFilter,
  SEARCH_RESULTS_SIZE,
  typeLabel,
  useDebouncedValue,
} from './utils'

gql`
  fragment AttributedUsageAggregateItem on AttributedUsageAggregate {
    preciseAmountCents
    eventsCount
    chargesUsage {
      units
      preciseAmountCents
      eventsCount
      charge {
        id
      }
      chargeFilter {
        id
      }
    }
  }

  query getAttributedUsage(
    $subscriptionId: ID!
    $groupBy: String!
    $filters: [AttributedUsageFilterInput!]
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
    $basis: AttributedUsageBasisEnum
    $chargeIds: [ID!]
    $splitChargeId: ID
    $limit: Int
    $page: Int
    $searchTerm: String
  ) {
    attributedUsage(
      subscriptionId: $subscriptionId
      groupBy: $groupBy
      filters: $filters
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
      basis: $basis
      chargeIds: $chargeIds
      splitChargeId: $splitChargeId
      limit: $limit
      page: $page
      searchTerm: $searchTerm
    ) {
      groupBy
      basis
      currency
      fromDatetime
      toDatetime
      metadata {
        currentPage
        totalPages
        totalCount
      }
      rows {
        value
        rank
        preciseAmountCents
        eventsCount
        chargesUsage {
          units
          preciseAmountCents
          eventsCount
          charge {
            id
          }
          chargeFilter {
            id
          }
        }
      }
      totals {
        ...AttributedUsageAggregateItem
      }
      unattributed {
        ...AttributedUsageAggregateItem
      }
    }
  }
`

// Errors are rendered in place (a too-large level is an expected state), never as a toast.
const QUERY_CONTEXT = { silentError: true }

type LevelProps = {
  groupBy: AttributionType
  scope: ScopeFilter[]
  depth: number
}

const useLevelQuery = ({
  groupBy,
  scope,
  page,
  limit,
  searchTerm,
  skip,
}: {
  groupBy: AttributionType
  scope: ScopeFilter[]
  page: number
  limit: number
  searchTerm?: string
  skip?: boolean
}): ReturnType<typeof useGetAttributedUsageQuery> =>
  useGetAttributedUsageQuery({
    variables: useLevelVariables({ groupBy: groupBy.code, scope, page, limit, searchTerm }),
    skip,
    context: QUERY_CONTEXT,
    notifyOnNetworkStatusChange: true,
  })

const levelError = (error: Parameters<typeof isQueryLimitError>[0]): string =>
  isQueryLimitError(error)
    ? 'This level is too large to load. Narrow it with a filter, a shorter period, or fewer charges.'
    : 'This level could not be loaded.'

type NodeRowProps = {
  groupBy: AttributionType
  scope: ScopeFilter[]
  depth: number
  row: NonNullable<
    ReturnType<typeof useGetAttributedUsageQuery>['data']
  >['attributedUsage']['rows'][number]
  highlighted?: boolean
}

const NodeRow = ({ groupBy, scope, depth, row, highlighted }: NodeRowProps): JSX.Element => {
  const { childTypeOf, listBy } = useAttributedUsageView()
  const [expanded, setExpanded] = useState(false)
  const childType = childTypeOf(groupBy)
  const nextType = childType ?? listBy
  const childScope = [...scope, { code: groupBy.code, values: [row.value] }]

  const renderChildren = (): JSX.Element | null => {
    if (!expanded || !nextType) return null
    if (childType)
      return <HierarchyLevel groupBy={childType} scope={childScope} depth={depth + 1} />

    return <FlatLevel groupBy={nextType} scope={childScope} depth={depth + 1} />
  }

  return (
    <>
      <UsageRow
        label={row.value}
        typeLabel={
          highlighted
            ? `${typeLabel(groupBy)} · #${formatCount(row.rank)} by usage`
            : typeLabel(groupBy)
        }
        depth={depth}
        aggregate={row}
        labelVariant={depth === 0 ? 'strong' : 'default'}
        highlighted={highlighted}
        expandable={!!nextType}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      />
      {renderChildren()}
    </>
  )
}

const ExtraPage = ({ groupBy, scope, depth, page }: LevelProps & { page: number }): JSX.Element => {
  const { data, loading, error } = useLevelQuery({
    groupBy,
    scope,
    page,
    limit: LEVEL_PAGE_SIZE,
  })

  if (loading && !data) return <SkeletonRows depth={depth} />
  if (error) return <MessageRow depth={depth}>{levelError(error)}</MessageRow>

  return (
    <>
      {data?.attributedUsage.rows.map((row) => (
        <NodeRow key={row.value} groupBy={groupBy} scope={scope} depth={depth} row={row} />
      ))}
    </>
  )
}

const LevelSearch = ({
  groupBy,
  scope,
  depth,
  totalCount,
  pinned,
  onPin,
}: LevelProps & {
  totalCount: number
  pinned?: NodeRowProps['row']
  onPin: (row?: NodeRowProps['row']) => void
}): JSX.Element => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const { data, loading } = useLevelQuery({
    groupBy,
    scope,
    page: 1,
    limit: SEARCH_RESULTS_SIZE,
    searchTerm: debouncedQuery,
    skip: !debouncedQuery,
  })
  const results = debouncedQuery ? (data?.attributedUsage.rows ?? []) : []
  const showDropdown = !!debouncedQuery && !loading

  return (
    <div
      className="relative flex items-center gap-2.5 border-b border-grey-200 py-1.5 pr-4"
      style={{ paddingLeft: indentOf(depth) + 22 }}
    >
      <div className="flex w-64 items-center gap-1.5 rounded-lg border border-grey-300 bg-white px-2 py-0.5">
        <Icon name="magnifying-glass" size="small" color="input" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Find a ${typeLabel(groupBy).toLowerCase()}…`}
          className="bg-transparent min-w-0 flex-1 border-0 text-xs text-grey-700 outline-none"
        />
      </div>
      {pinned ? (
        <>
          <span className="rounded-lg bg-blue-100 px-2 text-xs font-medium text-blue-700">
            Showing {pinned.value}
          </span>
          <button
            type="button"
            className="text-xs font-medium text-blue-600"
            onClick={() => onPin(undefined)}
          >
            Back to top {LEVEL_PAGE_SIZE}
          </button>
        </>
      ) : (
        <span className="text-xs text-grey-500">
          {formatCount(totalCount)} {typeLabel(groupBy).toLowerCase()} values · top{' '}
          {LEVEL_PAGE_SIZE} by usage
        </span>
      )}
      {showDropdown && (
        <div
          className="absolute top-[calc(100%-2px)] z-20 w-72 overflow-hidden rounded-xl border border-grey-300 bg-white py-1 shadow-md"
          style={{ left: indentOf(depth) + 22 }}
        >
          {results.length ? (
            results.map((row) => (
              <button
                type="button"
                key={row.value}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-grey-100"
                onClick={() => {
                  onPin(row)
                  setQuery('')
                }}
              >
                <span className="text-sm font-medium text-grey-700">{row.value}</span>
                <span className="flex-1" />
                <span className="text-xs text-grey-500">#{formatCount(row.rank)} by usage</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-grey-500">
              No {typeLabel(groupBy).toLowerCase()} matches this name.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const HierarchyLevel = ({ groupBy, scope, depth }: LevelProps): JSX.Element => {
  const [pages, setPages] = useState(1)
  const [pinned, setPinned] = useState<NodeRowProps['row']>()
  const { data, loading, error } = useLevelQuery({
    groupBy,
    scope,
    page: 1,
    limit: LEVEL_PAGE_SIZE,
  })

  if (loading && !data) return <SkeletonRows depth={depth} />
  if (error || !data) return <MessageRow depth={depth}>{levelError(error)}</MessageRow>

  const { rows, unattributed, metadata } = data.attributedUsage
  const totalCount = metadata.totalCount
  const shown = Math.min(totalCount, pages * LEVEL_PAGE_SIZE)
  const remaining = totalCount - shown

  const renderRows = (): JSX.Element => {
    if (pinned) {
      return <NodeRow groupBy={groupBy} scope={scope} depth={depth} row={pinned} highlighted />
    }

    return (
      <>
        {rows.map((row) => (
          <NodeRow key={row.value} groupBy={groupBy} scope={scope} depth={depth} row={row} />
        ))}
        {Array.from({ length: pages - 1 }).map((_, index) => (
          <ExtraPage key={index} groupBy={groupBy} scope={scope} depth={depth} page={index + 2} />
        ))}
        {remaining > 0 && (
          <MoreRow
            depth={depth}
            label={`Show ${Math.min(LEVEL_PAGE_SIZE, remaining)} more`}
            meta={`· ${formatCount(remaining)} ${typeLabel(groupBy).toLowerCase()} values left`}
            onClick={() => setPages((value) => value + 1)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {totalCount > LEVEL_PAGE_SIZE && (
        <LevelSearch
          groupBy={groupBy}
          scope={scope}
          depth={depth}
          totalCount={totalCount}
          pinned={pinned}
          onPin={setPinned}
        />
      )}
      {renderRows()}
      <UsageRow
        label={`No ${typeLabel(groupBy).toLowerCase()}`}
        typeLabel="unattributed"
        depth={depth}
        aggregate={unattributed}
        labelVariant="muted"
        muted
      />
    </>
  )
}

export const FlatLevel = ({ groupBy, scope, depth }: LevelProps): JSX.Element => {
  const [pages, setPages] = useState(1)
  const limit = FLAT_PAGE_SIZE * pages
  const { data, previousData, loading, error } = useLevelQuery({
    groupBy,
    scope,
    page: 1,
    limit,
  })
  const current = data ?? previousData

  if (loading && !current) return <SkeletonRows depth={depth} />
  if (error || !current) return <MessageRow depth={depth}>{levelError(error)}</MessageRow>

  const { rows, unattributed, metadata } = current.attributedUsage
  const remaining = metadata.totalCount - rows.length

  return (
    <>
      {rows.map((row) => (
        <UsageRow
          key={row.value}
          label={row.value}
          typeLabel={typeLabel(groupBy)}
          depth={depth}
          aggregate={row}
          labelVariant="code"
        />
      ))}
      {loading && <SkeletonRows depth={depth} count={1} />}
      {!loading && remaining > 0 && (
        <MoreRow
          depth={depth}
          label={`Show ${Math.min(FLAT_PAGE_SIZE, remaining)} more`}
          meta={`· ${formatCount(remaining)} ${typeLabel(groupBy)} values left`}
          onClick={() => setPages((value) => value + 1)}
        />
      )}
      <UsageRow
        label={`No ${typeLabel(groupBy)}`}
        typeLabel="unattributed"
        depth={depth}
        aggregate={unattributed}
        labelVariant="muted"
        muted
      />
    </>
  )
}
