import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  ComposableTableExpandToggle,
  ComposableTableGroupHeader,
  ComposableTableInlineError,
  ComposableTableLoadMore,
  ComposableTableRowTreeCell,
  ComposableTableSkeletonCell,
  ComposableTableTreeCell,
} from '../ComposableTableBlocks'
import { ComposableTableView } from '../ComposableTableView'
import { createComposableTableColumnHelper, useComposableTable } from '../useComposableTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SKELETON_TEST_ID = 'skeleton-cell'

type TreeNode = { id: string; name: string; subRows?: TreeNode[] }

const TREE: TreeNode[] = [
  { id: 'rnd', name: 'R&D', subRows: [{ id: 'ml', name: 'ML' }] },
  { id: 'sales', name: 'Sales' },
]

const treeColumnHelper = createComposableTableColumnHelper<TreeNode>()

const TreeTable = ({
  data,
  onToggle,
}: {
  data: TreeNode[]
  onToggle?: () => void
}): JSX.Element => {
  const table = useComposableTable({
    data,
    columns: [
      treeColumnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <ComposableTableRowTreeCell row={row} toggle={{ label: row.original.name, onToggle }}>
            {row.original.name}
          </ComposableTableRowTreeCell>
        ),
      }),
    ],
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
  })

  return <ComposableTableView table={table} />
}

describe('ComposableTableBlocks', () => {
  describe('GIVEN an expand toggle', () => {
    describe('WHEN it is collapsed and clicked', () => {
      it('THEN exposes its state and calls onToggle', async () => {
        const onToggle = jest.fn()

        render(
          <ComposableTableExpandToggle label="Expand R&D" isExpanded={false} onToggle={onToggle} />,
        )

        const toggle = screen.getByRole('button', { name: 'Expand R&D' })

        expect(toggle).toHaveAttribute('aria-expanded', 'false')

        await userEvent.click(toggle)

        expect(onToggle).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN it is expanded and loading', () => {
      it('THEN exposes the expanded state and is disabled', () => {
        render(
          <ComposableTableExpandToggle
            label="Collapse R&D"
            isExpanded
            isLoading
            onToggle={jest.fn()}
          />,
        )

        const toggle = screen.getByRole('button', { name: 'Collapse R&D' })

        expect(toggle).toHaveAttribute('aria-expanded', 'true')
        expect(toggle).toBeDisabled()
      })
    })
  })

  describe('GIVEN a tree cell', () => {
    describe('WHEN it renders at a depth', () => {
      it('THEN indents its content by depth', () => {
        render(<ComposableTableTreeCell depth={2}>Child</ComposableTableTreeCell>)

        expect(screen.getByText('Child')).toHaveStyle({ paddingLeft: '32px' })
      })

      it('THEN renders the given toggle', () => {
        render(
          <ComposableTableTreeCell
            depth={0}
            toggle={
              <ComposableTableExpandToggle label="Expand" isExpanded={false} onToggle={jest.fn()} />
            }
          >
            Root
          </ComposableTableTreeCell>,
        )

        expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a row tree cell', () => {
    describe('WHEN its row can expand', () => {
      it('THEN renders a toggle bound to the row expansion', async () => {
        render(<TreeTable data={TREE} />)

        const toggle = screen.getByRole('button', { name: 'R&D' })

        expect(toggle).toHaveAttribute('aria-expanded', 'false')

        await userEvent.click(toggle)

        expect(screen.getByRole('button', { name: 'R&D' })).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByText('ML')).toHaveStyle({ paddingLeft: '16px' })
      })

      it('THEN calls the given onToggle instead of expanding the row', async () => {
        const onToggle = jest.fn()

        render(<TreeTable data={TREE} onToggle={onToggle} />)

        await userEvent.click(screen.getByRole('button', { name: 'R&D' }))

        expect(onToggle).toHaveBeenCalledTimes(1)
        expect(screen.queryByText('ML')).not.toBeInTheDocument()
      })
    })

    describe('WHEN its row cannot expand but another row can', () => {
      it('THEN keeps a spacer in place of the toggle', () => {
        render(<TreeTable data={TREE} />)

        const cell = screen.getByText('Sales')

        expect(within(cell).queryByRole('button')).not.toBeInTheDocument()
        expect(cell.firstElementChild).toHaveClass('size-4')
      })
    })

    describe('WHEN no row of the table can expand', () => {
      it('THEN renders neither a toggle nor a spacer', () => {
        render(<TreeTable data={[{ id: 'sales', name: 'Sales' }]} />)

        expect(screen.getByText('Sales').firstElementChild).toBeNull()
      })
    })
  })

  describe('GIVEN a show more button', () => {
    describe('WHEN it is clicked', () => {
      it('THEN calls onLoadMore', async () => {
        const onLoadMore = jest.fn()

        render(
          <ComposableTableLoadMore label="Show more" isLoading={false} onLoadMore={onLoadMore} />,
        )

        await userEvent.click(screen.getByRole('button', { name: 'Show more' }))

        expect(onLoadMore).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the next page is loading', () => {
      it('THEN is disabled', () => {
        render(<ComposableTableLoadMore label="Show more" isLoading onLoadMore={jest.fn()} />)

        expect(screen.getByRole('button')).toBeDisabled()
      })
    })

    describe('WHEN it is disabled without loading', () => {
      it('THEN is disabled without a loading spinner', () => {
        render(
          <ComposableTableLoadMore
            label="Show more"
            isLoading={false}
            disabled
            onLoadMore={jest.fn()}
          />,
        )

        const button = screen.getByRole('button', { name: 'Show more' })

        expect(button).toBeDisabled()
        expect(button.querySelector('[data-test^="processing/"]')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an inline error', () => {
    describe('WHEN retry is clicked', () => {
      it('THEN shows the message and calls onRetry', async () => {
        const onRetry = jest.fn()

        render(
          <ComposableTableInlineError
            label="Could not load"
            retryLabel="Retry"
            onRetry={onRetry}
          />,
        )

        expect(screen.getByText('Could not load')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

        expect(onRetry).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a group header', () => {
    describe('WHEN it has an action', () => {
      it('THEN renders the label and the action', () => {
        render(
          <ComposableTableGroupHeader
            label="Billable metrics"
            action={<button>Show more</button>}
          />,
        )

        expect(screen.getByText('Billable metrics')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a skeleton cell', () => {
    describe('WHEN it renders', () => {
      it('THEN renders a placeholder with its test id', () => {
        render(<ComposableTableSkeletonCell data-test={SKELETON_TEST_ID} />)

        expect(screen.getByTestId(SKELETON_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
