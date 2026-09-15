import { IconName } from 'lago-design-system'
import { ReactNode } from 'react'

import { TooltipProps } from '../Tooltip'

export type Align = 'left' | 'center' | 'right'

type ActionItemBase = {
  title: string | ReactNode
  startIcon?: IconName
  endIcon?: IconName
  disabled?: boolean
  tooltip?: string
  tooltipListener?: boolean
  tooltipPlacement?: TooltipProps['placement']
  dataTest?: string
}

export type ActionItem<T> = ActionItemBase &
  (
    | { onAction: (item: T) => void | Promise<void>; link?: never }
    | { link: (item: T) => string; onAction?: never }
  )

export type ActionColumn<T> = (item: T) => Array<ActionItem<T> | null> | ReactNode
