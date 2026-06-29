import { ReactNode } from 'react'

import { Typography, TypographyProps } from '~/components/designSystem/Typography'

import { usePurchaseOrderContext } from './PurchaseOrderContext'
import { normalizePurchaseOrderNumber } from './utils'

type PurchaseOrderNumberProps = Omit<TypographyProps, 'children'> & {
  children?: ReactNode
  placeholder?: ReactNode
}

export const PurchaseOrderNumber = ({
  children,
  placeholder = '-',
  ...props
}: PurchaseOrderNumberProps) => {
  const { value } = usePurchaseOrderContext()
  const normalizedValue = normalizePurchaseOrderNumber(value)

  return (
    <Typography variant="body" color="grey700" forceBreak {...props}>
      {children ?? normalizedValue ?? placeholder}
    </Typography>
  )
}
