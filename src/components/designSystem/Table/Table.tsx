import MUITable from '@mui/material/Table'
import MUITableBody from '@mui/material/TableBody'
import { type TableCellProps } from '@mui/material/TableCell'
import MUITableHead from '@mui/material/TableHead'
import MUITableRow, { type TableRowProps } from '@mui/material/TableRow'
import { isValidElement, MouseEvent, PropsWithChildren, ReactNode, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import {
  GenericPlaceholder,
  GenericPlaceholderProps,
} from '~/components/designSystem/GenericPlaceholder'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { Link, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { isModifiedClick } from '~/core/utils/isModifiedClick'
import { ResponsiveStyleValue, setResponsiveProperty } from '~/core/utils/responsiveProps'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PopperOpener, theme } from '~/styles'
import { tw } from '~/styles/utils'

import { PADDING_SPACING_RIGHT_PX } from './const'
import TableCell from './TableCell'
import TableInnerCell from './TableInnerCell'
import type { ActionColumn, ActionItem, Align } from './types'

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`

type DotNestedKeys<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<
        keyof T,
        symbol
      >]
    : ''
) extends infer D
  ? Extract<D, string>
  : never

export type TableColumn<T> = {
  // Using DotNestedKeys to get nested keys for object with more than one level deepness
  key: DotNestedKeys<T>
  title: string | ReactNode
  content: (item: T) => ReactNode
  textAlign?: Align
  maxSpace?: boolean
  maxWidth?: number
  minWidth?: number
  truncateOverflow?: boolean
  tdCellClassName?: string
}

type DataItem = {
  id: string
}

export type TableContainerSize = 0 | 4 | 16 | 48
type RowSize = 48 | 72

export type TablePlaceholder = {
  emptyState?: Partial<GenericPlaceholderProps>
  errorState?: Partial<GenericPlaceholderProps>
}

export interface TableProps<T> {
  name: string
  data: T[]
  columns: Array<TableColumn<T> | null>
  isLoading?: boolean
  hasError?: boolean
  loadingRowCount?: number
  placeholder?: TablePlaceholder
  activeRowId?: string
  onRowActionLink?: (item: T) => string
  /**
   * Names the row link. Without it the link inherits the first cell's text, which
   * on a status-first table is the same word on every row.
   */
  rowLinkLabel?: (item: T) => string
  onRowActionClick?: (item: T) => void
  actionColumn?: ActionColumn<T>
  actionColumnTooltip?: (item: T) => string
  rowDataTestId?: (item: T) => string
  containerSize?: ResponsiveStyleValue<TableContainerSize>
  rowSize?: RowSize
  tableInDialog?: boolean
  containerClassName?: string
}

const INTERACTIVE_CELL_COMPONENTS: ReadonlySet<unknown> = new Set([
  Button,
  ButtonLink,
  TypographyWithCopy,
])

// An anchor may not contain interactive descendants, and several first columns
// render their own control (the inline copy button). Those cells keep the plain
// row click instead of gaining a link.
const hasInteractiveContent = (node: ReactNode): boolean => {
  if (Array.isArray(node)) {
    return node.some(hasInteractiveContent)
  }

  if (!isValidElement(node)) {
    return false
  }

  if (node.type === 'button' || node.type === 'a') {
    return true
  }

  if (INTERACTIVE_CELL_COMPONENTS.has(node.type)) {
    return true
  }

  return hasInteractiveContent((node.props as { children?: ReactNode })?.children)
}

const ACTION_COLUMN_ID = 'actionColumn'
const LOADING_ROW_COUNT = DEFAULT_PAGE_SIZE

export const OPEN_ACTION_BUTTON_TEST_ID = 'open-action-button'

const MIN_CONTAINER_PADDING_PX = 4

// The outer columns' padding follows the table's exterior gutter
// (`containerSize`), but never drops below 4px so both edges keep the same small
// gutter even when `containerSize` is 0 (e.g. dialog/usage tables). On the left
// this also keeps the inline copy button's -4px overhang clear of the boundary.
const clampContainerPadding = (
  value: ResponsiveStyleValue<TableContainerSize>,
): ResponsiveStyleValue<number> => {
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([breakpoint, size]) => [
        breakpoint,
        size === undefined ? size : Math.max(size, MIN_CONTAINER_PADDING_PX),
      ]),
    )
  }

  return Math.max(value, MIN_CONTAINER_PADDING_PX)
}

const countMaxSpaceColumns = <T,>(columns: TableColumn<T>[]) =>
  columns.reduce((acc, column) => {
    if (column.maxSpace) {
      acc += 1
    }

    return acc
  }, 0)

const TableRow = ({
  children,
  className,
  isClickable,
  ...props
}: TableRowProps & {
  isClickable?: boolean
}) => {
  return (
    <MUITableRow
      className={tw(
        {
          'cursor-pointer': !!isClickable,
        },
        className,
      )}
      sx={{
        '&:hover:not(:active), &:focus:not(:active), &:hover:not(:active) .lago-table-action-cell, &:focus:not(:active) .lago-table-action-cell, &[data-state="selected"]':
          {
            backgroundColor: isClickable ? theme.palette.grey[100] : undefined,
          },
        '&:active, &:active .lago-table-action-cell': {
          backgroundColor: isClickable ? theme.palette.grey[200] : undefined,
        },
        // Remove hover effect when action column is hovered
        '&:has([data-id="actionColumn"] button:hover)': {
          backgroundColor: 'unset !important',

          '& .lago-table-action-cell': {
            backgroundColor: theme.palette.background.paper,
          },
        },
      }}
      {...props}
    >
      {children}
    </MUITableRow>
  )
}

const TableActionCell = ({
  children,
  className,
  ...props
}: PropsWithChildren & TableCellProps & { className?: string }) => {
  return (
    <TableCell
      className={tw(
        'lago-table-action-cell',
        'sticky right-0 z-10 w-10 bg-white animate-shadow-left [box-shadow:none]',
        className,
      )}
      sx={{
        '& > div': {
          justifyContent: 'center',
          paddingLeft: theme.spacing(3),
        },
      }}
      {...props}
    >
      {children}
    </TableCell>
  )
}

const LoadingRows = <T,>({
  columns,
  id,
  shouldDisplayActionColumn,
  loadingRowCount = LOADING_ROW_COUNT,
}: Pick<TableProps<T>, 'loadingRowCount'> & {
  columns: Array<TableColumn<T>>
  id: string
  shouldDisplayActionColumn: boolean
}) => {
  return Array.from({ length: loadingRowCount }).map((_, i) => (
    <TableRow key={`${id}-loading-row-${i}`}>
      {columns.map((col, j) => (
        <TableCell
          tdCellClassName={col.tdCellClassName}
          hasPlaceholderDisplayed={false}
          key={`${id}-loading-cell-${i}-${j}`}
        >
          <TableInnerCell minWidth={col.minWidth} maxWidth={col.maxWidth} align={col.textAlign}>
            <div
              style={{
                width: !!col.minWidth ? `${col.minWidth - PADDING_SPACING_RIGHT_PX}px` : '100%',
              }}
            >
              <Skeleton className="w-full" variant="text" />
            </div>
          </TableInnerCell>
        </TableCell>
      ))}
      {shouldDisplayActionColumn && (
        <TableActionCell>
          <TableInnerCell>
            <Button disabled icon="dots-horizontal" variant="quaternary" />
          </TableInnerCell>
        </TableActionCell>
      )}
    </TableRow>
  ))
}

const ActionItemButton = <T,>({
  action,
  item,
  closePopper,
}: {
  action: ActionItem<T>
  item: T
  closePopper: VoidFunction
}) => {
  const renderAction = () => {
    const buttonProps = {
      fullWidth: true,
      align: 'left' as const,
      variant: 'quaternary' as const,
      startIcon: action.startIcon,
      endIcon: action.endIcon,
    }

    // A disabled navigation action stays a button: `ButtonLink` keeps its `href`,
    // so the anchor would remain followable outside of pointer events.
    if (action.disabled) {
      return (
        <Button {...buttonProps} disabled data-test={action.dataTest}>
          {action.title}
        </Button>
      )
    }

    if (action.link) {
      return (
        <ButtonLink
          type="button"
          to={action.link(item)}
          buttonProps={buttonProps}
          onClick={closePopper}
          data-test={action.dataTest}
        >
          {action.title}
        </ButtonLink>
      )
    }

    return (
      <Button
        {...buttonProps}
        onClick={async () => {
          await action.onAction(item)
          closePopper()
        }}
        data-test={action.dataTest}
      >
        {action.title}
      </Button>
    )
  }

  const actionElement = renderAction()

  if (action.tooltip) {
    return (
      <Tooltip
        title={action.tooltip}
        disableHoverListener={action.tooltipListener}
        placement={action.tooltipPlacement}
      >
        {actionElement}
      </Tooltip>
    )
  }

  return actionElement
}

export const Table = <T extends DataItem>({
  name,
  data,
  columns,
  isLoading,
  hasError,
  containerSize = 48,
  rowSize = 48,
  loadingRowCount,
  placeholder,
  tableInDialog,
  containerClassName,
  activeRowId,
  onRowActionLink,
  rowLinkLabel,
  onRowActionClick,
  actionColumn,
  actionColumnTooltip,
  rowDataTestId,
}: TableProps<T>) => {
  const TABLE_ID = `table-${name}`
  const filteredColumns = columns
    .filter((column) => !!column)
    .map((column) => {
      const shouldForceColumnMaxWidth =
        !!column.maxSpace && (column?.textAlign === 'left' || !column?.textAlign)

      return {
        ...column,
        maxWidth: shouldForceColumnMaxWidth ? 600 : column.maxWidth,
      }
    })
  const maxSpaceColumns = countMaxSpaceColumns(filteredColumns)
  const tableRef = useRef<HTMLTableElement>(null)
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  // `useParams()` can return undefined outside a Router context (e.g. some tests).
  const params = useParams<{ organizationSlug?: string }>()
  const organizationSlug = params?.organizationSlug

  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${TABLE_ID}-row-${i}`,
    navigate: (id) => {
      const item = data.find((dataItem) => dataItem.id === id)

      if (!item) return

      onRowActionClick?.(item)

      const link = onRowActionLink?.(item)

      if (link) {
        navigate(link)
      }
    },
  })

  const isClickable = (!!onRowActionLink || !!onRowActionClick) && !isLoading
  const shouldDisplayActionColumn =
    !!actionColumn &&
    (data.length > 0
      ? data.some((item) => {
          if (Array.isArray(actionColumn?.(item))) {
            const actionColumnArray = actionColumn?.(item) as Array<ActionItem<T> | null>
            const filteredArray = actionColumnArray.filter((action) => !!action)

            if (actionColumnArray && filteredArray.length > 0) {
              return true
            }

            return false
          }

          if (actionColumn?.(item)) {
            return true
          }

          return false
        })
      : false)

  const colSpan = filteredColumns.length + (shouldDisplayActionColumn ? 1 : 0)

  const handleRowClick = (e: MouseEvent<HTMLTableRowElement>, item: T) => {
    if (!onRowActionLink && !onRowActionClick) return

    // Ignore clicks bubbling up from portaled content (dialogs, poppers) rendered
    // inside a cell: they are React descendants of the row but live outside its DOM
    // subtree, so they would otherwise trigger the row navigation.
    if (e.target instanceof Node && !e.currentTarget.contains(e.target)) {
      return
    }

    if (!(e.target instanceof HTMLElement)) {
      return
    }

    // Anything interactive in a cell owns its own click — the row-link anchor,
    // inline copy buttons, the action column opener — including a label nested
    // inside one, which an `instanceof` check on the target would miss.
    if (e.target.closest('a, button')) {
      return
    }

    // Prevent row action when clicking on action column button
    const popper = tableRef.current?.querySelector(`[data-id=${TABLE_ID}-popper]`)

    if (popper) {
      return
    }

    const hasSideKeyPressed = e.metaKey || e.ctrlKey

    onRowActionClick?.(item)

    if (!onRowActionLink) {
      return
    }

    const link = onRowActionLink(item)

    if (!link) {
      return
    }

    // `window.open` bypasses the `useNavigate` wrapper, so prepend the org
    // slug manually via the shared util (same guard logic as the wrapper).
    const prefixedLink = prependOrgSlug(link, organizationSlug)

    if (hasSideKeyPressed) {
      window.open(prefixedLink, '_blank')
    } else {
      navigate(link)
    }
  }

  // The first cell doubles as the row's real anchor, so the row target can be
  // middle-clicked, opened in a new tab, copied and announced as a link.
  const renderFirstCellContent = (column: TableColumn<T>, item: T) => {
    const content = column.content(item)
    const link = onRowActionLink?.(item)
    const isRenderedContent =
      content !== null && content !== undefined && typeof content !== 'boolean'

    if (!link || !isRenderedContent || hasInteractiveContent(content)) {
      return content
    }

    return (
      <Link
        // The row is the tab stop and handles Enter; a focusable anchor per row
        // would double every tab stop in the list.
        tabIndex={-1}
        aria-label={rowLinkLabel?.(item)}
        className="text-inherit hover:no-underline focus:ring-0"
        to={link}
        onClick={(e) => {
          // Some first columns nest their own button (inline copy) or link.
          // Let those own the click rather than navigating the row away.
          if (e.target instanceof Element && e.target.closest('a, button') !== e.currentTarget) {
            e.preventDefault()
            return
          }

          // The browser owns a modified click and opens the target elsewhere,
          // so the current view must not move with it.
          if (isModifiedClick(e)) {
            return
          }

          onRowActionClick?.(item)
        }}
      >
        {content}
      </Link>
    )
  }

  const renderPlaceholder = () => {
    if (hasError) {
      return (
        <TableRow
          sx={{
            '& .lago-table-cell': {
              ...setResponsiveProperty('paddingLeft', containerSize),
              ...setResponsiveProperty('paddingRight', containerSize),
            },
          }}
        >
          <TableCell hasPlaceholderDisplayed colSpan={colSpan}>
            <GenericPlaceholder
              noMargins
              className="mx-auto py-12 [&>svg]:w-[136px]"
              title={placeholder?.errorState?.title || translate('text_62b31e1f6a5b8b1b745ece48')}
              subtitle={
                placeholder?.errorState?.subtitle || translate('text_62bb102b66ff57dbfe7905c2')
              }
              image={placeholder?.errorState?.image || <ErrorImage />}
              buttonAction={placeholder?.errorState?.buttonAction}
              buttonTitle={placeholder?.errorState?.buttonTitle}
              buttonVariant={placeholder?.errorState?.buttonVariant}
            />
          </TableCell>
        </TableRow>
      )
    }

    if (!isLoading && data.length === 0) {
      return (
        <TableRow
          sx={{
            '& .lago-table-cell': {
              ...setResponsiveProperty('paddingLeft', containerSize),
              ...setResponsiveProperty('paddingRight', containerSize),
            },
          }}
        >
          <TableCell hasPlaceholderDisplayed colSpan={colSpan}>
            <GenericPlaceholder
              noMargins
              className="mx-auto py-12 [&>svg]:w-[136px]"
              title={placeholder?.emptyState?.title || translate('text_62b31e1f6a5b8b1b745ece48')}
              subtitle={
                placeholder?.emptyState?.subtitle || translate('text_62bb102b66ff57dbfe7905c2')
              }
              image={placeholder?.emptyState?.image || <EmptyImage />}
              buttonAction={placeholder?.emptyState?.buttonAction}
              buttonTitle={placeholder?.emptyState?.buttonTitle}
              buttonVariant={placeholder?.emptyState?.buttonVariant}
            />
          </TableCell>
        </TableRow>
      )
    }
  }

  return (
    // Width is set to 0 and minWidth to 100% to prevent table from overflowing its container
    // cf. https://stackoverflow.com/a/73091777
    // [-webkit-transform:translateZ(0)] is used to prevent scrollbar flickering on Safari
    // cf. https://stackoverflow.com/questions/67076468/why-scrollbar-is-behind-sticky-elements-in-ios-safari
    <div
      className={tw(
        'h-full w-0 min-w-full overflow-auto [-webkit-transform:translateZ(0)]',
        containerClassName,
      )}
    >
      <MUITable
        className="border-separate"
        data-test={TABLE_ID}
        id={TABLE_ID}
        ref={tableRef}
        sx={{
          '& .lago-table-cell:first-of-type .lago-table-inner-cell': {
            ...setResponsiveProperty('paddingLeft', clampContainerPadding(containerSize)),
          },
          '& .lago-table-cell:last-of-type .lago-table-inner-cell': {
            ...setResponsiveProperty('paddingRight', clampContainerPadding(containerSize)),
          },
          '& tbody .lago-table-inner-cell': {
            minHeight: rowSize,
          },
        }}
      >
        <MUITableHead>
          <tr>
            <>
              {filteredColumns.map((column, i) => (
                <TableCell
                  className="sticky top-0 z-sectionHead border-b-0 bg-white shadow-b"
                  key={`${TABLE_ID}-head-${i}`}
                  align={column.textAlign || 'left'}
                  maxSpace={column.maxSpace ? 100 / maxSpaceColumns : undefined}
                  tdCellClassName={column.tdCellClassName}
                >
                  <TableInnerCell
                    className="min-h-10 text-grey-600"
                    align={column.textAlign}
                    style={{
                      fontSize: theme.typography.captionHl.fontSize,
                      fontWeight: theme.typography.captionHl.fontWeight,
                      lineHeight: theme.typography.captionHl.lineHeight,
                    }}
                  >
                    {column.title}
                  </TableInnerCell>
                </TableCell>
              ))}
              {shouldDisplayActionColumn && <TableActionCell className="top-0 z-sectionHead" />}
            </>
          </tr>
        </MUITableHead>

        <MUITableBody>
          {renderPlaceholder() ??
            (!isLoading &&
              data.length > 0 &&
              data.map((item, i) => (
                <TableRow
                  key={`${TABLE_ID}-row-${i}`}
                  id={`${TABLE_ID}-row-${i}`}
                  data-id={item.id}
                  data-state={!!activeRowId && item.id === activeRowId ? 'selected' : undefined}
                  isClickable={isClickable}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={isClickable ? onKeyDown : undefined}
                  onClick={isClickable ? (e) => handleRowClick(e, item) : undefined}
                  data-test={rowDataTestId?.(item) || `table-row-${i}`}
                >
                  {filteredColumns.map((column, j) => (
                    <TableCell
                      key={`${TABLE_ID}-cell-${i}-${j}`}
                      align={column.textAlign || 'left'}
                      maxSpace={column.maxSpace ? 100 / maxSpaceColumns : undefined}
                      tdCellClassName={column.tdCellClassName}
                    >
                      <TableInnerCell
                        align={column.textAlign}
                        maxWidth={column.maxWidth}
                        minWidth={column.minWidth}
                        truncateOverflow={column.truncateOverflow}
                      >
                        <Typography className="-ml-1 pl-1" noWrap>
                          {j === 0 ? renderFirstCellContent(column, item) : column.content(item)}
                        </Typography>
                      </TableInnerCell>
                    </TableCell>
                  ))}
                  {shouldDisplayActionColumn && (
                    <TableActionCell>
                      <TableInnerCell data-id={ACTION_COLUMN_ID}>
                        {Array.isArray(actionColumn(item)) ? (
                          <Popper
                            displayInDialog={tableInDialog}
                            popperGroupName={`${TABLE_ID}-action-cell`}
                            PopperProps={{ placement: 'bottom-end' }}
                            opener={({ isOpen }) => (
                              <PopperOpener className="relative right-0 top-0 h-full md:right-0">
                                <Tooltip
                                  className="right-0"
                                  placement="top-end"
                                  disableHoverListener={isOpen}
                                  title={actionColumnTooltip?.(item) || null}
                                >
                                  <Button
                                    icon="dots-horizontal"
                                    variant="quaternary"
                                    data-test={OPEN_ACTION_BUTTON_TEST_ID}
                                  />
                                </Tooltip>
                              </PopperOpener>
                            )}
                          >
                            {({ closePopper }) => (
                              <MenuPopper data-id={`${TABLE_ID}-popper`}>
                                {(actionColumn(item) as Array<ActionItem<T> | null>)
                                  .filter((action) => !!action)
                                  .map((action, j) => {
                                    if (!action) {
                                      return
                                    }

                                    return (
                                      <ActionItemButton
                                        key={`${TABLE_ID}-popper-action-${i}-${j}`}
                                        action={action}
                                        item={item}
                                        closePopper={closePopper}
                                      />
                                    )
                                  })}
                              </MenuPopper>
                            )}
                          </Popper>
                        ) : (
                          (actionColumn(item) as ReactNode)
                        )}
                      </TableInnerCell>
                    </TableActionCell>
                  )}
                </TableRow>
              )))}
          {isLoading &&
            LoadingRows({
              columns: filteredColumns,
              id: TABLE_ID,
              loadingRowCount,
              shouldDisplayActionColumn,
            })}
        </MUITableBody>
      </MUITable>
    </div>
  )
}
