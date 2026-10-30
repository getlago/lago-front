import { ExpandedState, Updater } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { generatePath } from 'react-router'

import {
  createDataTableColumnHelper,
  DataTableExpandToggle,
  DataTableLoadMore,
  DataTableTreeCell,
  DataTableView,
  useDataTable,
} from '~/components/designSystem/DataTable'
import { Typography } from '~/components/designSystem/Typography'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

type Invoice = { id: string; customer: string; status: string; amount: string }

const INVOICES: Invoice[] = [
  { id: '1', customer: 'Acme Corp', status: 'Paid', amount: '€1,200.00' },
  { id: '2', customer: 'Globex', status: 'Pending', amount: '€340.50' },
  { id: '3', customer: 'Initech', status: 'Overdue', amount: '€89.99' },
]

const invoiceColumnHelper = createDataTableColumnHelper<Invoice>()

const invoiceColumns = invoiceColumnHelper.columns([
  invoiceColumnHelper.accessor('customer', { header: 'Customer' }),
  invoiceColumnHelper.accessor('status', { header: 'Status' }),
  invoiceColumnHelper.accessor('amount', {
    header: 'Amount',
    meta: { align: 'right', shrink: true },
  }),
])

const FlatExample = (): JSX.Element => {
  const table = useDataTable({ data: INVOICES, columns: invoiceColumns, getRowId: (row) => row.id })

  return <DataTableView table={table} />
}

type Usage = { id: string; team: string; tokens: number; seats: number; storage: number }

const USAGES: Usage[] = [
  { id: 'rnd', team: 'R&D', tokens: 120_000, seats: 42, storage: 310 },
  { id: 'sales', team: 'Sales', tokens: 18_500, seats: 12, storage: 25 },
  { id: 'ops', team: 'Operations', tokens: 4_200, seats: 8, storage: 90 },
]

const sum = (key: keyof Omit<Usage, 'id' | 'team'>): number =>
  USAGES.reduce((total, usage) => total + usage[key], 0)

const usageColumnHelper = createDataTableColumnHelper<Usage>()

const VALUE_META = { align: 'right', shrink: true, className: 'min-w-24' } as const

const usageColumns = usageColumnHelper.columns([
  usageColumnHelper.accessor('team', { header: 'Team', footer: 'Total' }),
  usageColumnHelper.group({
    id: 'metrics',
    header: 'Billable metrics',
    columns: usageColumnHelper.columns([
      usageColumnHelper.accessor('tokens', {
        header: 'Tokens',
        meta: VALUE_META,
        footer: () => sum('tokens'),
      }),
      usageColumnHelper.accessor('seats', {
        header: 'Seats',
        meta: VALUE_META,
        footer: () => sum('seats'),
      }),
      usageColumnHelper.accessor('storage', {
        header: 'Storage (GB)',
        meta: VALUE_META,
        footer: () => sum('storage'),
      }),
    ]),
  }),
  usageColumnHelper.display({
    id: 'total',
    header: 'Total',
    meta: { align: 'right' },
    cell: ({ row }) => row.original.tokens + row.original.seats + row.original.storage,
    footer: () => sum('tokens') + sum('seats') + sum('storage'),
  }),
])

const GroupedExample = (): JSX.Element => {
  const table = useDataTable({
    data: USAGES,
    columns: usageColumns,
    getRowId: (row) => row.id,
    initialState: { columnPinning: { start: ['team'], end: ['total'] } },
  })

  return <DataTableView table={table} hasFooter />
}

type TreeNode = { id: string; name: string; depth: number; units: number }
type TreeRow =
  | (TreeNode & { kind: 'data'; subRows: TreeRow[] })
  | { kind: 'loadMore'; id: string; parentId: string }

type Children =
  | { status: 'loading' }
  | { status: 'loaded'; nodes: TreeNode[]; page: number; isLoadingMore: boolean }

const MAX_DEPTH = 2
const PAGE_SIZE = 3
const TOTAL_PAGES = 2
const LEVEL_NAMES = ['Department', 'Team', 'User']
const ROOT_ID = 'root'

const fetchChildren = (parentId: string, depth: number, page: number): Promise<TreeNode[]> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: PAGE_SIZE }, (_, index) => {
            const position = (page - 1) * PAGE_SIZE + index + 1

            return {
              id: `${parentId}/${position}`,
              name: `${LEVEL_NAMES[depth]} ${position}`,
              depth,
              units: Math.round(1000 / (depth + 1) / position),
            }
          }),
        ),
      600,
    ),
  )

const treeColumnHelper = createDataTableColumnHelper<TreeRow>()

const TreeExample = (): JSX.Element => {
  const [children, setChildren] = useState<Record<string, Children>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const loadPage = async (parentId: string, depth: number, page: number): Promise<void> => {
    setChildren((previous) => {
      const current = previous[parentId]

      if (page === 1 || current?.status !== 'loaded') {
        return { ...previous, [parentId]: { status: 'loading' } }
      }

      return { ...previous, [parentId]: { ...current, isLoadingMore: true } }
    })

    const nodes = await fetchChildren(parentId, depth, page)

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
  }

  useEffect(() => {
    loadPage(ROOT_ID, 0, 1)
  }, [])

  const rows = useMemo(() => {
    const buildRows = (parentId: string): TreeRow[] => {
      const entry = children[parentId]

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
      .forEach((id) => loadPage(id, id.split('/').length - 1, 1))

    setExpanded(next)
  }

  const columns = useMemo(
    () => [
      treeColumnHelper.display({
        id: 'name',
        header: 'Entity',
        cell: ({ row }) => {
          const { original } = row

          if (original.kind === 'loadMore') {
            const parent = children[original.parentId]

            return (
              <DataTableTreeCell depth={row.depth}>
                <DataTableLoadMore
                  label="Show more"
                  isLoading={parent?.status === 'loaded' && parent.isLoadingMore}
                  onLoadMore={() =>
                    parent?.status === 'loaded' &&
                    loadPage(original.parentId, row.depth, parent.page + 1)
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
        meta: { align: 'right', shrink: true, className: 'min-w-24' },
        cell: ({ row }) => (row.original.kind === 'data' ? row.original.units : null),
      }),
    ],
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

const EXAMPLES = [
  {
    title: 'Flat list',
    description: 'Columns from accessors, no extra feature. Lists should keep using `Table`.',
    component: <FlatExample />,
  },
  {
    title: 'Column groups, sticky columns and footer',
    description:
      'A group column renders a two-row header; first and last columns are pinned with `columnPinning`.',
    component: <GroupedExample />,
  },
  {
    title: 'Tree with lazy children and show more',
    description:
      'Children are fetched on expand (600ms mock) and paged per level. Fetching lives in the example, the kit only renders the async state.',
    component: <TreeExample />,
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
