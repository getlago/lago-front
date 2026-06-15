import MUITableCell, { type TableCellProps } from '@mui/material/TableCell'
import { PropsWithChildren } from 'react'

import { theme } from '~/styles'
import { tw } from '~/styles/utils'

import { PADDING_SPACING_RIGHT_PX } from './const'

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
        width: maxSpace ? `${maxSpace}%` : 'auto',
        borderBottom: hasPlaceholderDisplayed ? 'none' : `1px solid ${theme.palette.grey[300]}`,
        boxShadow: isBlurred ? theme.shadows[7] : 'none',
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

export default TableCell
