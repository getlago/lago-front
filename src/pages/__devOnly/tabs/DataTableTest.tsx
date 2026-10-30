import { ExpandedState, Updater } from '@tanstack/react-table'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import {
  createDataTableColumnHelper,
  DataTableExpandToggle,
  DataTableFooterRow,
  DataTableGroupHeader,
  DataTableInlineError,
  DataTableLoadMore,
  DataTableSkeletonCell,
  DataTableTreeCell,
  DataTableView,
  useDataTable,
} from '~/components/designSystem/DataTable'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'
import { CurrencyEnum } from '~/generated/graphql'

const MOCK_DELAY_MS = 600

const wait = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

const VALUE_META = { align: 'right', shrink: true, className: 'min-w-24' } as const

/* Column groups, sticky columns, footer and show more columns */

const METRICS = [
  { key: 'tokens', label: 'Tokens' },
  { key: 'seats', label: 'Seats' },
  { key: 'storage', label: 'Storage (GB)' },
  { key: 'requests', label: 'API requests' },
  { key: 'agents', label: 'Agent calls' },
] as const

type MetricKey = (typeof METRICS)[number]['key']
type Usage = { id: string; team: string; metrics: Record<MetricKey, number> }

const USAGES: Usage[] = [
  {
    id: 'rnd',
    team: 'R&D',
    metrics: { tokens: 120_000, seats: 42, storage: 310, requests: 8_400, agents: 950 },
  },
  {
    id: 'sales',
    team: 'Sales',
    metrics: { tokens: 18_500, seats: 12, storage: 25, requests: 1_200, agents: 40 },
  },
  {
    id: 'ops',
    team: 'Operations',
    metrics: { tokens: 4_200, seats: 8, storage: 90, requests: 600, agents: 15 },
  },
]

const METRICS_PER_PAGE = 2

const usageColumnHelper = createDataTableColumnHelper<Usage>()

const GroupedExample = (): JSX.Element => {
  const [visibleCount, setVisibleCount] = useState(METRICS_PER_PAGE)
  const [loadedCount, setLoadedCount] = useState(METRICS_PER_PAGE)
  const isLoadingColumns = loadedCount < visibleCount
  const visibleMetrics = METRICS.slice(0, visibleCount)
  const loadedMetrics = METRICS.slice(0, loadedCount)

  const showMoreColumns = async (): Promise<void> => {
    const next = visibleCount + METRICS_PER_PAGE

    setVisibleCount(next)
    await wait()
    setLoadedCount(next)
  }

  const columns = useMemo(() => {
    const sum = (key: MetricKey): number =>
      USAGES.reduce((total, usage) => total + usage.metrics[key], 0)

    const renderValue = (index: number, value: number): ReactNode =>
      index < loadedCount ? value : <DataTableSkeletonCell />

    return usageColumnHelper.columns([
      usageColumnHelper.accessor('team', { header: 'Team', footer: 'Total' }),
      usageColumnHelper.group({
        id: 'metrics',
        header: () => (
          <DataTableGroupHeader
            label="Billable metrics"
            action={
              visibleCount < METRICS.length && (
                <DataTableLoadMore
                  label="Show more"
                  isLoading={isLoadingColumns}
                  onLoadMore={showMoreColumns}
                />
              )
            }
          />
        ),
        columns: visibleMetrics.map(({ key, label }, index) =>
          usageColumnHelper.display({
            id: key,
            header: label,
            meta: VALUE_META,
            cell: ({ row }) => renderValue(index, row.original.metrics[key]),
            footer: () => renderValue(index, sum(key)),
          }),
        ),
      }),
      usageColumnHelper.display({
        id: 'total',
        header: 'Total',
        meta: { align: 'right' },
        cell: ({ row }) =>
          loadedMetrics.reduce((total, { key }) => total + row.original.metrics[key], 0),
        footer: () => loadedMetrics.reduce((total, { key }) => total + sum(key), 0),
      }),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount, loadedCount])

  const table = useDataTable({
    data: USAGES,
    columns,
    getRowId: (row) => row.id,
    initialState: { columnPinning: { start: ['team'], end: ['total'] } },
  })

  return <DataTableView table={table} hasFooter />
}

/* Table states */

type TableState = 'data' | 'loading' | 'empty' | 'error'

const TABLE_STATES: TableState[] = ['data', 'loading', 'empty', 'error']

const StatesExample = (): JSX.Element => {
  const [state, setState] = useState<TableState>('data')

  const table = useDataTable({
    data: state === 'data' ? USAGES : [],
    columns: useMemo(
      () =>
        usageColumnHelper.columns([
          usageColumnHelper.accessor('team', { header: 'Team' }),
          usageColumnHelper.display({
            id: 'tokens',
            header: 'Tokens',
            meta: VALUE_META,
            cell: ({ row }) => row.original.metrics.tokens,
          }),
        ]),
      [],
    ),
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {TABLE_STATES.map((tableState) => (
          <Button
            key={tableState}
            size="small"
            variant={state === tableState ? 'primary' : 'tertiary'}
            onClick={() => setState(tableState)}
          >
            {tableState}
          </Button>
        ))}
      </div>
      <DataTableView
        table={table}
        isLoading={state === 'loading'}
        hasError={state === 'error'}
        placeholder={{
          emptyState: { title: 'No usage yet', subtitle: 'Usage appears once events arrive.' },
          errorState: { buttonTitle: 'Retry', buttonAction: () => setState('data') },
        }}
      />
    </div>
  )
}

/* Tree with lazy children, show more and per-node errors */

type TreeNode = { id: string; name: string; depth: number; units: number }
type TreeRow =
  | (TreeNode & { kind: 'data'; subRows: TreeRow[] })
  | { kind: 'loadMore'; id: string; parentId: string }
  | { kind: 'error'; id: string; parentId: string }

type Children =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; nodes: TreeNode[]; page: number; isLoadingMore: boolean }

const MAX_DEPTH = 2
const PAGE_SIZE = 3
const TOTAL_PAGES = 2
const LEVEL_NAMES = ['Department', 'Team', 'User']
const ROOT_ID = 'root'
const FAILING_NODE_ID = `${ROOT_ID}/3`

const getDepth = (parentId: string): number => parentId.split('/').length - 1

const fetchChildren = async (
  parentId: string,
  page: number,
  shouldFail: boolean,
): Promise<TreeNode[]> => {
  await wait()

  if (shouldFail) throw new Error('Mock failure')

  const depth = getDepth(parentId)

  return Array.from({ length: PAGE_SIZE }, (_, index) => {
    const position = (page - 1) * PAGE_SIZE + index + 1

    return {
      id: `${parentId}/${position}`,
      name: `${LEVEL_NAMES[depth]} ${position}`,
      depth,
      units: Math.round(1000 / (depth + 1) / position),
    }
  })
}

const treeColumnHelper = createDataTableColumnHelper<TreeRow>()

const TreeExample = (): JSX.Element => {
  const [children, setChildren] = useState<Record<string, Children>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [failedOnce, setFailedOnce] = useState(false)

  const loadPage = async (parentId: string, page: number): Promise<void> => {
    const shouldFail = parentId === FAILING_NODE_ID && !failedOnce

    setChildren((previous) => {
      const current = previous[parentId]

      if (page === 1 || current?.status !== 'loaded') {
        return { ...previous, [parentId]: { status: 'loading' } }
      }

      return { ...previous, [parentId]: { ...current, isLoadingMore: true } }
    })

    try {
      const nodes = await fetchChildren(parentId, page, shouldFail)

      setChildren((previous) => {
        const current = previous[parentId]
        const loaded = page > 1 && current?.status === 'loaded' ? current.nodes : []

        return {
          ...previous,
          [parentId]: {
            status: 'loaded',
            nodes: [...loaded, ...nodes],
            page,
            isLoadingMore: false,
          },
        }
      })
    } catch {
      setFailedOnce(true)
      setChildren((previous) => ({ ...previous, [parentId]: { status: 'error' } }))
    }
  }

  useEffect(() => {
    loadPage(ROOT_ID, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(() => {
    const buildRows = (parentId: string): TreeRow[] => {
      const entry = children[parentId]

      if (entry?.status === 'error') return [{ kind: 'error', id: `${parentId}-error`, parentId }]
      if (entry?.status !== 'loaded') return []

      const dataRows: TreeRow[] = entry.nodes.map((node) => ({
        ...node,
        kind: 'data',
        subRows: buildRows(node.id),
      }))

      return entry.page < TOTAL_PAGES
        ? [...dataRows, { kind: 'loadMore', id: `${parentId}-more`, parentId }]
        : dataRows
    }

    return buildRows(ROOT_ID)
  }, [children])

  const handleExpandedChange = (updater: Updater<ExpandedState>): void => {
    const next = typeof updater === 'function' ? updater(expanded) : updater

    if (next === true) return

    Object.keys(next)
      .filter((id) => next[id] && !expanded[id] && !children[id])
      .forEach((id) => loadPage(id, 1))

    setExpanded(next)
  }

  const columns = useMemo(
    () => [
      treeColumnHelper.display({
        id: 'name',
        header: 'Entity',
        spanColumns: ({ row }) => (row.original.kind === 'error' ? Infinity : 1),
        cell: ({ row }) => {
          const { original } = row

          if (original.kind === 'error') {
            return (
              <DataTableTreeCell depth={row.depth}>
                <DataTableInlineError
                  label="Could not load this level."
                  retryLabel="Retry"
                  onRetry={() => loadPage(original.parentId, 1)}
                />
              </DataTableTreeCell>
            )
          }

          if (original.kind === 'loadMore') {
            const parent = children[original.parentId]

            return (
              <DataTableTreeCell depth={row.depth}>
                <DataTableLoadMore
                  label="Show more"
                  isLoading={parent?.status === 'loaded' && parent.isLoadingMore}
                  onLoadMore={() =>
                    parent?.status === 'loaded' && loadPage(original.parentId, parent.page + 1)
                  }
                />
              </DataTableTreeCell>
            )
          }

          const toggle = row.getCanExpand() ? (
            <DataTableExpandToggle
              label={original.name}
              isExpanded={row.getIsExpanded()}
              isLoading={children[original.id]?.status === 'loading'}
              onToggle={row.getToggleExpandedHandler()}
            />
          ) : undefined

          return (
            <DataTableTreeCell depth={row.depth} toggle={toggle}>
              <Typography variant="body" color="grey700" noWrap>
                {original.name}
              </Typography>
            </DataTableTreeCell>
          )
        },
      }),
      treeColumnHelper.display({
        id: 'units',
        header: 'Units',
        meta: VALUE_META,
        cell: ({ row }) => (row.original.kind === 'data' ? row.original.units : null),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children],
  )

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === 'data' ? row.subRows : undefined),
    getRowCanExpand: (row) => row.original.kind === 'data' && row.original.depth < MAX_DEPTH,
    initialState: { columnPinning: { start: ['name'], end: [] } },
    state: { expanded },
    onExpandedChange: handleExpandedChange,
  })

  return <DataTableView table={table} isLoading={children[ROOT_ID]?.status !== 'loaded'} />
}

/* Group rows and multi-row footer */

type InvoiceRow =
  | { kind: 'group'; id: string; label: string }
  | { kind: 'fee'; id: string; item: string; units: number; unitPrice: number }

const INVOICE_ROWS: InvoiceRow[] = [
  { kind: 'group', id: 'pro', label: 'Pro plan · Oct 1 – Oct 31, 2026' },
  { kind: 'fee', id: 'pro-sub', item: 'Subscription fee', units: 1, unitPrice: 499 },
  { kind: 'fee', id: 'pro-seats', item: 'Seats', units: 42, unitPrice: 12 },
  { kind: 'group', id: 'ai', label: 'AI add-on · Oct 1 – Oct 31, 2026' },
  { kind: 'fee', id: 'ai-tokens', item: 'LLM tokens (per 1k)', units: 1_200, unitPrice: 0.4 },
  { kind: 'fee', id: 'ai-agents', item: 'Agent calls', units: 950, unitPrice: 0.05 },
]

const TAX_RATE = 0.2

const formatAmount = (value: number): string =>
  intlFormatNumber(value, { currency: CurrencyEnum.Eur })

const getFeeAmount = (row: InvoiceRow): number =>
  row.kind === 'fee' ? row.units * row.unitPrice : 0

const invoiceColumnHelper = createDataTableColumnHelper<InvoiceRow>()

const invoiceColumns = invoiceColumnHelper.columns([
  invoiceColumnHelper.display({
    id: 'item',
    header: 'Item',
    spanColumns: ({ row }) => (row.original.kind === 'group' ? Infinity : 1),
    cell: ({ row }) =>
      row.original.kind === 'group' ? (
        <Typography variant="captionHl" color="grey700" noWrap>
          {row.original.label}
        </Typography>
      ) : (
        row.original.item
      ),
  }),
  invoiceColumnHelper.display({
    id: 'units',
    header: 'Units',
    meta: VALUE_META,
    cell: ({ row }) => (row.original.kind === 'fee' ? row.original.units : null),
  }),
  invoiceColumnHelper.display({
    id: 'unitPrice',
    header: 'Unit price',
    meta: VALUE_META,
    cell: ({ row }) => (row.original.kind === 'fee' ? formatAmount(row.original.unitPrice) : null),
  }),
  invoiceColumnHelper.display({
    id: 'amount',
    header: 'Amount',
    meta: VALUE_META,
    cell: ({ row }) =>
      row.original.kind === 'fee' ? formatAmount(getFeeAmount(row.original)) : null,
  }),
])

const subtotal = INVOICE_ROWS.reduce((total, row) => total + getFeeAmount(row), 0)

const INVOICE_FOOTER_ROWS: DataTableFooterRow[] = [
  { id: 'subtotal', cells: { unitPrice: 'Subtotal excl. tax', amount: formatAmount(subtotal) } },
  { id: 'tax', cells: { unitPrice: 'Tax (20%)', amount: formatAmount(subtotal * TAX_RATE) } },
  { id: 'total', cells: { unitPrice: 'Total', amount: formatAmount(subtotal * (1 + TAX_RATE)) } },
]

const GroupRowsExample = (): JSX.Element => {
  const table = useDataTable({
    data: INVOICE_ROWS,
    columns: invoiceColumns,
    getRowId: (row) => row.id,
  })

  return (
    <DataTableView
      table={table}
      footerRows={INVOICE_FOOTER_ROWS}
      getRowTone={(row) => (row.original.kind === 'group' ? 'muted' : 'default')}
    />
  )
}

const EXAMPLES = [
  {
    title: 'Column groups, sticky columns and show more columns',
    description:
      'A group column renders a two-row header with an action. "Show more" adds columns whose cells show a skeleton until their data arrives.',
    component: <GroupedExample />,
  },
  {
    title: 'Table states',
    description:
      'Loading, empty and error placeholders with the same defaults and overrides as the DS `Table`.',
    component: <StatesExample />,
  },
  {
    title: 'Tree with lazy children, show more and errors',
    description:
      'Children load on expand and page per level. "Department 3" fails on its first load: an error row under it retries that node only. Spans stop at the pinned column boundary, so the error stays in the Entity column.',
    component: <TreeExample />,
  },
  {
    title: 'Group rows and multi-row footer',
    description:
      'Invoice-like layout: full-width group rows with `spanColumns`, then subtotal, tax and total footer rows.',
    component: <GroupRowsExample />,
  },
]

export const DataTableTest = (): JSX.Element => (
  <div className="flex flex-col gap-12">
    {EXAMPLES.map(({ title, description, component }) => (
      <section key={title} className="flex flex-col gap-4">
        <div>
          <Typography variant="headline">{title}</Typography>
          <Typography variant="caption" color="grey600">
            {description}
          </Typography>
        </div>
        {component}
      </section>
    ))}
  </div>
)

export const dataTableTab = {
  title: 'Data table',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'data-table' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <DataTableTest />
    </div>
  ),
}
