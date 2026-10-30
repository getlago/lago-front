import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { tw } from '~/styles/utils'

export type DataTablePinned = false | 'start' | 'end'
export type DataTableAlign = 'left' | 'right'
export type DataTableTone = 'default' | 'muted'

export type DataTableCellVariants = {
  pinned?: DataTablePinned
  align?: DataTableAlign
  tone?: DataTableTone
  shrink?: boolean
}

const getCellClassName = ({
  pinned = false,
  align = 'left',
  tone = 'default',
  shrink = false,
}: DataTableCellVariants): string =>
  tw(
    'h-12 whitespace-nowrap border-b border-grey-300 px-1 py-0',
    align === 'right' ? 'text-right' : 'text-left',
    shrink && 'w-px',
    pinned === 'start' && 'sticky left-0 z-10 border-r',
    pinned === 'end' && 'sticky right-0 z-10 w-px border-l bg-grey-100 pl-6',
    tone === 'muted' && 'bg-grey-100',
    tone === 'default' && pinned !== 'end' && 'bg-white',
  )

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & DataTableCellVariants

export const DataTableTh = ({
  pinned,
  align,
  tone,
  shrink,
  className,
  ...props
}: ThProps): JSX.Element => (
  <th className={tw(getCellClassName({ pinned, align, tone, shrink }), className)} {...props} />
)

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & DataTableCellVariants

export const DataTableTd = ({
  pinned,
  align,
  tone,
  shrink,
  className,
  ...props
}: TdProps): JSX.Element => (
  <td className={tw(getCellClassName({ pinned, align, tone, shrink }), className)} {...props} />
)

export const DataTableRoot = ({
  children,
  'data-test': dataTest,
}: {
  children: ReactNode
  'data-test'?: string
}): JSX.Element => (
  <div className="w-full overflow-x-auto" data-test={dataTest}>
    <table className="w-full border-separate border-spacing-0">{children}</table>
  </div>
)
