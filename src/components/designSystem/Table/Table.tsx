import {
  Table as MUITable,
  TableBody as MUITableBody,
  TableCell as MUITableCell,
  TableHead as MUITableHead,
  TableRow as MUITableRow,
  TableCellProps,
  TableRowProps,
} from '@mui/material'
import { IconName } from 'lago-design-system'
import { MouseEvent, PropsWithChildren, ReactNode, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder, GenericPlaceholderProps } from '~/components/GenericPlaceholder'
import { ResponsiveStyleValue, setResponsiveProperty } from '~/core/utils/responsiveProps'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PopperOpener, theme } from '~/styles'
import { tw } from '~/styles/utils'

const PADDING_SPACING_RIGHT_PX = 32

type Align = 'left' | 'center' | 'right'

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

export type ActionItem<T> = {
  title: string | ReactNode
  onAction: (item: T) => void
  startIcon?: IconName
  endIcon?: IconName
  disabled?: boolean
  tooltip?: string
  tooltipListener?: boolean
  dataTest?: string
}

export type TableContainerSize = 0 | 4 | 16 | 48
type RowSize = 48 | 72

export interface TableProps<T> {
  name: string
  data: T[]
  columns: Array<TableColumn<T> | null>
  isLoading?: boolean
  hasError?: boolean
  loadingRowCount?: number
  placeholder?: {
    emptyState?: Partial<GenericPlaceholderProps>
    errorState?: Partial<GenericPlaceholderProps>
  }
  onRowActionLink?: (item: T) => string
  actionColumn?: (item: T) => Array<ActionItem<T> | null> | ReactNode
  actionColumnTooltip?: (item: T) => string
  rowDataTestId?: (item: T) => string
  containerSize?: ResponsiveStyleValue<TableContainerSize>
  rowSize?: RowSize
  tableInDialog?: boolean
  containerClassName?: string
}

const ACTION_COLUMN_ID = 'actionColumn'
const LOADING_ROW_COUNT = 3

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

const TableCell = ({
  children,
  className,
  hasPlaceholderDisplayed,
  isBlurred,
  maxSpace,
  tdCellClassName,
  ...props
}: PropsWithChildren &
  TableCellProps & {
    className?: string
    isBlurred?: boolean
    hasPlaceholderDisplayed?: boolean
    maxSpace?: number
    tdCellClassName?: string
  }) => {
  return (
    <MUITableCell
      className={tw('lago-table-cell', 'w-auto whitespace-nowrap p-0', className, tdCellClassName)}
      style={{
        width: !!maxSpace ? `${maxSpace}%` : 'auto',
        borderBottom: !!hasPlaceholderDisplayed ? 'none' : `1px solid ${theme.palette.grey[300]}`,
        boxShadow: !!isBlurred ? theme.shadows[7] : 'none',
      }}
      sx={{
        '& > div': {
          paddingRight: `${PADDING_SPACING_RIGHT_PX}px`,
        },
        '&:first-of-type > div': {
          paddingLeft: 0,
        },
        '&:last-of-type > div': {
          paddingRight: 0,
        },
      }}
      {...props}
    >
      {children}
    </MUITableCell>
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

const TableInnerCell = ({
  align,
  children,
  className,
  minWidth,
  maxWidth,
  style,
  truncateOverflow,
}: PropsWithChildren & {
  align?: Align
  className?: string
  minWidth?: number
  maxWidth?: number
  style?: React.CSSProperties
  truncateOverflow?: boolean
}) => {
  return (
    <div
      className={tw(
        'lago-table-inner-cell',
        'flex items-center',
        {
          'justify-start': align === 'left',
          'justify-center': align === 'center',
          'justify-end': align === 'right',
          grid: !!truncateOverflow,
        },
        className,
      )}
      style={{
        minWidth: minWidth ? `${minWidth}px` : 'auto',
        maxWidth: maxWidth ? `${maxWidth}px` : 'auto',
        ...style,
      }}
    >
      {children}
    </div>
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
  const button = (
    <Button
      fullWidth
      startIcon={action.startIcon}
      endIcon={action.endIcon}
      variant="quaternary"
      align="left"
      disabled={action.disabled}
      onClick={async () => {
        await action.onAction(item)
        closePopper()
      }}
      data-test={action.dataTest}
    >
      {action.title}
    </Button>
  )

  const withTooltip = (
    <Tooltip title={action.tooltip} disableHoverListener={action.tooltipListener}>
      {button}
    </Tooltip>
  )

  if (action.tooltip) {
    return withTooltip
  }

  return button
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
  onRowActionLink,
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

  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${TABLE_ID}-row-${i}`,
    navigate: (id) => {
      const item = data.find((dataItem) => dataItem.id === id)

      if (item) {
        onRowActionLink?.(item)
      }
    },
  })

  const isClickable = !!onRowActionLink && !isLoading
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
    if (!onRowActionLink) return

    // Prevent row action when clicking on button or link in cell
    if (e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement) {
      return
    }

    // Prevent row action when clicking on action column button
    const popper = tableRef.current?.querySelector(`[data-id=${TABLE_ID}-popper]`)

    if (popper) {
      return
    }

    if (e.target instanceof HTMLElement) {
      const actionColumnButton = e.target.closest('button')?.dataset.id

      const hasSideKeyPressed = e.metaKey || e.ctrlKey

      // Make sure anything other than the action column button is clicked
      if (actionColumnButton !== ACTION_COLUMN_ID) {
        const link = onRowActionLink(item)

        if (hasSideKeyPressed) {
          window.open(link, '_blank')
        } else {
          navigate(link)
        }
      }
    }
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
            ...setResponsiveProperty('paddingLeft', containerSize),
          },
          '& .lago-table-cell:last-of-type .lago-table-inner-cell': {
            ...setResponsiveProperty('paddingRight', containerSize),
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
            (data.length > 0 &&
              data.map((item, i) => (
                <TableRow
                  key={`${TABLE_ID}-row-${i}`}
                  id={`${TABLE_ID}-row-${i}`}
                  data-id={item.id}
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
                        <Typography noWrap>{column.content(item)}</Typography>
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
                                    data-test="open-action-button"
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
