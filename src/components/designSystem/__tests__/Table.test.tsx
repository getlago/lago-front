import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '~/components/designSystem/Button'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { render, testMockNavigateFn } from '~/test-utils'

import { Table } from '../Table/Table'

const data = [
  {
    id: '1',
    name: 'John Doe',
    age: 30,
  },
  {
    id: '2',
    name: 'Jane Doe',
    age: 25,
  },
  {
    id: '3',
    name: 'James Smith',
    age: 40,
  },
  {
    id: '4',
    name: 'Jane Smith',
    age: 35,
  },
]

async function prepare({ props }: { props?: Record<string, any> } = {}) {
  await act(() =>
    render(
      <Table
        name="test"
        data={data}
        columns={
          props?.columns || [
            {
              key: 'name' as const,
              title: 'Name',
              content: (row: any) => row.name,
            },
            {
              key: 'age' as const,
              title: 'Age',
              content: (row: any) => row.age,
            },
          ]
        }
        {...props}
      />,
    ),
  )
}

describe('Table', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders some basic table', async () => {
    await prepare()

    // Header
    expect(screen.queryAllByRole('columnheader')).toHaveLength(2)
    expect(screen.queryAllByRole('columnheader')[0]).toHaveTextContent('Name')
    expect(screen.queryAllByRole('columnheader')[1]).toHaveTextContent('Age')

    // Body
    expect(screen.queryAllByRole('rowgroup')).toHaveLength(2)
    const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

    expect(bodyRows).toHaveLength(4)
    expect(within(bodyRows[0]).queryAllByRole('cell')).toHaveLength(2)
    expect(within(bodyRows[0]).queryAllByRole('cell')[0]).toHaveTextContent('John Doe')
    expect(within(bodyRows[0]).queryAllByRole('cell')[1]).toHaveTextContent('30')
  })

  it('renders with interaction', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const onRow = jest.fn()

    await prepare({
      props: {
        onRowActionLink: (row: any) => onRow(row),
        actionColumn: () => [
          {
            title: 'Edit',
            onAction: (row: any) => onEdit(row),
          },
          {
            title: 'Delete',
            onAction: (row: any) => onDelete(row),
          },
        ],
      },
    })

    // Header
    expect(screen.queryAllByRole('columnheader')).toHaveLength(3)
    expect(screen.queryAllByRole('columnheader')[2]).not.toHaveValue()

    // Body
    expect(screen.queryAllByRole('rowgroup')).toHaveLength(2)
    const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

    expect(bodyRows).toHaveLength(4)
    expect(within(bodyRows[0]).queryAllByRole('cell')).toHaveLength(3)
    expect(within(bodyRows[0]).queryByTestId('open-action-button')).toBeInTheDocument()

    // Click on action menu
    await userEvent.click(
      within(bodyRows[0]).queryByTestId('open-action-button') as HTMLButtonElement,
    )

    // Check if action menu is visible
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(within(screen.getByRole('tooltip')).queryAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()

    // Click on Edit
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenNthCalledWith(1, data[0])

    // Click on row
    await userEvent.click(bodyRows[0])
    expect(onRow).toHaveBeenNthCalledWith(1, data[0])
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('renders with custom action element', async () => {
    const onClick = jest.fn()

    await prepare({
      props: {
        actionColumn: (row: any) => <Button onClick={onClick(row)}>Click me</Button>,
        onRowActionLink: (row: any) => `/rows/${row.id}`,
      },
    })

    // Header
    expect(screen.queryAllByRole('columnheader')).toHaveLength(3)
    expect(screen.queryAllByRole('columnheader')[2]).not.toHaveValue()

    // On row action
    const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

    await userEvent.click(bodyRows[0])
    expect(testMockNavigateFn).toHaveBeenNthCalledWith(1, '/rows/1')

    // On click action
    await userEvent.click(within(bodyRows[0]).getByText('Click me'))
    expect(onClick).toHaveBeenNthCalledWith(1, data[0])
    expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
  })

  describe('GIVEN a table whose rows navigate', () => {
    describe('WHEN the rows render', () => {
      it('THEN should expose the row target as a real anchor in the first cell', async () => {
        await prepare({ props: { onRowActionLink: (row: any) => `/rows/${row.id}` } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')
        const rowLink = within(bodyRows[0]).getByRole('link', { name: 'John Doe' })

        expect(rowLink).toHaveAttribute('href', '/rows/1')
      })

      it('THEN should keep the anchor out of the tab order, the row being the tab stop', async () => {
        await prepare({ props: { onRowActionLink: (row: any) => `/rows/${row.id}` } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        expect(within(bodyRows[0]).getByRole('link', { name: 'John Doe' })).toHaveAttribute(
          'tabindex',
          '-1',
        )
      })

      it('THEN should not render an anchor when the row only has a click handler', async () => {
        await prepare({ props: { onRowActionClick: jest.fn() } })

        expect(screen.queryAllByRole('link')).toHaveLength(0)
      })
    })

    describe('WHEN the first cell renders its own control', () => {
      // An anchor may not contain interactive descendants, so the cell keeps the
      // plain row click. Guards the real case: an inline copy button.
      it.each([
        ['a button', (row: any) => <Button onClick={jest.fn()}>copy {row.name}</Button>],
        [
          'a TypographyWithCopy',
          (row: any) => <TypographyWithCopy variant="body">{row.name}</TypographyWithCopy>,
        ],
      ])('THEN should not wrap %s in the row anchor', async (_, content) => {
        await prepare({
          props: {
            onRowActionLink: (row: any) => `/rows/${row.id}`,
            columns: [{ key: 'name' as const, title: 'Name', content }],
          },
        })

        expect(screen.queryAllByRole('link')).toHaveLength(0)
      })

      it('THEN should still wrap a cell whose content is inert', async () => {
        await prepare({
          props: {
            onRowActionLink: (row: any) => `/rows/${row.id}`,
            columns: [
              {
                key: 'name' as const,
                title: 'Name',
                content: (row: any) => <div>{row.name}</div>,
              },
            ],
          },
        })

        expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/rows/1')
      })

      it('THEN should run only the nested handler', async () => {
        const onCellButtonClick = jest.fn()

        await prepare({
          props: {
            onRowActionLink: (row: any) => `/rows/${row.id}`,
            columns: [
              {
                key: 'name' as const,
                title: 'Name',
                content: (row: any) => <Button onClick={onCellButtonClick}>copy {row.name}</Button>,
              },
            ],
          },
        })

        await userEvent.click(screen.getByRole('button', { name: 'copy John Doe' }))

        expect(onCellButtonClick).toHaveBeenCalledTimes(1)
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a side effect is declared next to the row link', () => {
      // The href is built during render, so a side effect can no longer live in
      // `onRowActionLink`; it rides on `onRowActionClick` and must not replace
      // the navigation.
      it.each([
        ['the row', (row: HTMLElement) => row],
        ['the row anchor', (row: HTMLElement) => within(row).getByRole('link')],
      ])('THEN should run it once and still navigate when clicking %s', async (_, getTarget) => {
        const onSideEffect = jest.fn()

        await prepare({
          props: {
            onRowActionLink: (row: any) => `/rows/${row.id}`,
            onRowActionClick: onSideEffect,
          },
        })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        await userEvent.click(getTarget(bodyRows[0]))

        expect(onSideEffect).toHaveBeenCalledTimes(1)
        expect(onSideEffect).toHaveBeenCalledWith(data[0])
      })
    })
  })

  describe('GIVEN a focused row', () => {
    describe('WHEN Enter is pressed', () => {
      // The row is the list's tab stop; before this the link was built and thrown
      // away, so keyboard activation did nothing at all.
      it('THEN should navigate to the row target', async () => {
        await prepare({ props: { onRowActionLink: (row: any) => `/rows/${row.id}` } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        bodyRows[1].focus()
        await userEvent.keyboard('{Enter}')

        expect(testMockNavigateFn).toHaveBeenCalledWith('/rows/2')
      })

      it('THEN should run the click handler when the row has no link', async () => {
        const onRowActionClick = jest.fn()

        await prepare({ props: { onRowActionClick } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        bodyRows[0].focus()
        await userEvent.keyboard('{Enter}')

        expect(onRowActionClick).toHaveBeenCalledWith(data[0])
      })
    })
  })

  describe('GIVEN an action item declared as a link', () => {
    describe('WHEN the action menu opens', () => {
      it('THEN should render the entry as an anchor to its target', async () => {
        await prepare({
          props: {
            actionColumn: () => [{ title: 'Edit', link: (row: any) => `/rows/${row.id}/edit` }],
          },
        })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        await userEvent.click(
          within(bodyRows[0]).queryByTestId('open-action-button') as HTMLButtonElement,
        )

        expect(within(screen.getByRole('tooltip')).getByRole('link')).toHaveAttribute(
          'href',
          '/rows/1/edit',
        )
      })

      it('THEN should render a disabled entry as a button, exposing no link', async () => {
        await prepare({
          props: {
            actionColumn: () => [
              { title: 'Edit', disabled: true, link: (row: any) => `/rows/${row.id}/edit` },
            ],
          },
        })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        await userEvent.click(
          within(bodyRows[0]).queryByTestId('open-action-button') as HTMLButtonElement,
        )

        const menu = screen.getByRole('tooltip')

        expect(within(menu).queryByRole('link')).not.toBeInTheDocument()
        expect(menu.querySelector('[href]')).toBeNull()
        expect(within(menu).getByRole('button', { name: 'Edit' })).toBeDisabled()
      })
    })
  })

  describe('GIVEN a first cell that renders nothing', () => {
    describe('WHEN the rows render', () => {
      // An empty anchor has no accessible name; several first columns return
      // `null` for rows in a state that has no detail page.
      it('THEN should not wrap it in an anchor', async () => {
        await prepare({
          props: {
            onRowActionLink: (row: any) => `/rows/${row.id}`,
            columns: [{ key: 'name' as const, title: 'Name', content: () => null }],
          },
        })

        expect(screen.queryAllByRole('link')).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a row link builder that returns nothing', () => {
    describe('WHEN a row is clicked', () => {
      // A builder legitimately returns '' for an item with no target; navigating
      // there resolves to the current route and drops its query params.
      it('THEN should neither render an anchor nor navigate', async () => {
        await prepare({ props: { onRowActionLink: () => '' } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        expect(screen.queryAllByRole('link')).toHaveLength(0)

        await userEvent.click(bodyRows[0])

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the row anchor holds the focus', () => {
    describe('WHEN ArrowDown is pressed', () => {
      // Clicking the first cell focuses the anchor, not the row, so resolving the
      // current row from `document.activeElement` finds no row at all.
      it('THEN should move the focus to the next row', async () => {
        await prepare({ props: { onRowActionLink: (row: any) => `/rows/${row.id}` } })

        const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

        within(bodyRows[0]).getByRole('link').focus()
        await userEvent.keyboard('{ArrowDown}')

        expect(bodyRows[1]).toHaveFocus()
      })
    })
  })

  it('renders with loading state', async () => {
    await prepare({
      props: {
        isLoading: true,
        data: [],
      },
    })

    // Header
    expect(screen.queryAllByRole('columnheader')).toHaveLength(2)
    expect(screen.queryAllByRole('columnheader')[0]).toHaveTextContent('Name')
    expect(screen.queryAllByRole('columnheader')[1]).toHaveTextContent('Age')

    // Body
    expect(screen.queryAllByRole('rowgroup')).toHaveLength(2)
    const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

    expect(bodyRows).toHaveLength(DEFAULT_PAGE_SIZE)
    expect(within(bodyRows[0]).queryAllByRole('cell')).toHaveLength(2)
  })

  it('renders with empty state', async () => {
    await prepare({
      props: {
        isLoading: false,
        data: [],
      },
    })

    expect(screen.getByText('empty.svg')).toBeInTheDocument()
  })

  it('renders with error state', async () => {
    await prepare({
      props: {
        hasError: true,
      },
    })

    expect(screen.getByText('error.svg')).toBeInTheDocument()
  })
})
