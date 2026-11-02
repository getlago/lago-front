import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { tw } from '~/styles/utils'

export type ComposableTablePinned = false | 'start' | 'end'
export type ComposableTableAlign = 'left' | 'right'
export type ComposableTableTone = 'default' | 'muted'

export type ComposableTableCellVariants = {
  pinned?: ComposableTablePinned
  align?: ComposableTableAlign
  tone?: ComposableTableTone
  shrink?: boolean
}

const getCellClassName = ({
  pinned = false,
  align = 'left',
  tone = 'default',
  shrink = false,
}: ComposableTableCellVariants): string =>
  tw(
    'h-12 whitespace-nowrap border-b border-grey-300 px-1 py-0',
    align === 'right' ? 'text-right' : 'text-left',
    shrink && 'w-px',
    pinned === 'start' && 'sticky left-0 z-10 border-r',
    pinned === 'end' && 'sticky right-0 z-10 w-px border-l bg-grey-100 pl-6',
    tone === 'muted' && 'bg-grey-100',
    tone === 'default' && pinned !== 'end' && 'bg-white',
  )

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & ComposableTableCellVariants

export const ComposableTableTh = ({
  pinned,
  align,
  tone,
  shrink,
  className,
  ...props
}: ThProps): JSX.Element => (
  <th className={tw(getCellClassName({ pinned, align, tone, shrink }), className)} {...props} />
)

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & ComposableTableCellVariants

export const ComposableTableTd = ({
  pinned,
  align,
  tone,
  shrink,
  className,
  ...props
}: TdProps): JSX.Element => (
  <td className={tw(getCellClassName({ pinned, align, tone, shrink }), className)} {...props} />
)

export const ComposableTableRoot = ({
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
